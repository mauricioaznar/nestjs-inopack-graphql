import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
    AccessTokenPayload,
    LoginInput,
    SessionMeta,
    TokenPair,
    UserWithRoles,
} from '../../common/dto/entities';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/modules/prisma/prisma.service';
import { jwtConstants } from '../../common/constants/jwt';

// The minimum a token needs to describe its bearer. Both `validateUser`'s return
// and a freshly re-read user row satisfy it, which is why rotation can reuse the
// same signing path as login.
interface TokenSubject {
    id: number;
    email: string;
    user_roles: { role_id?: number | null }[];
}

// Every write to a refresh-token family goes through one of these, so the same
// code serves a standalone call (`this.prisma`) and a call already inside a
// transaction (`tx`). `PrismaService` is a `PrismaClient` and satisfies it.
type PrismaClientLike = Prisma.TransactionClient;

// What `lockFamily` returns: the family's rows as they exist *now*, read under
// `FOR UPDATE`. Deliberately not a Prisma model read — see `lockFamily`.
interface LockedFamilyRow {
    id: number;
    revoked_at: Date | null;
    expires_at: Date;
}

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) {}

    async validateUser({
        email,
        password,
    }: {
        email: string;
        password: string;
    }): Promise<UserWithRoles | null> {
        const user = await this.prisma.users.findFirst({
            include: {
                // Only live role assignments may reach the token — a revoked
                // role must not keep granting access.
                user_roles: {
                    where: { active: 1 },
                },
            },
            where: {
                email: email,
                // A deactivated / soft-deleted user (`active = -1`) could log in
                // before this line existed.
                active: 1,
            },
        });
        if (!user) {
            return null;
        }
        let storedPassword = user.password;
        if (user.password.match(/^\$2y(.+)$/i)) {
            storedPassword = user.password.replace(/^\$2y(.+)$/i, '$2a$1');
        }
        const isMatch = await bcrypt.compare(password, storedPassword);
        if (!isMatch) {
            return null;
        }
        return {
            ...user,
            password: undefined,
        };
    }

    // REST login: full token pair. The caller (auth.controller) is responsible
    // for putting `refreshToken` into the cookie and returning only the access
    // token in the body.
    async loginWithCredentials(
        userInput: LoginInput,
        meta: SessionMeta = {},
    ): Promise<TokenPair> {
        const user = await this.validateUser(userInput);
        if (!user) {
            throw new BadRequestException(
                'Could not log-in with the provided credentials',
            );
        }

        // Opportunistic housekeeping: a user who logs in regularly would
        // otherwise accumulate one dead row per rotation forever. Cheap, indexed
        // by user_id, and only touches rows that can no longer authenticate
        // anything.
        await this.prisma.refresh_tokens.deleteMany({
            where: { user_id: user.id, expires_at: { lt: new Date() } },
        });

        // A new login starts a new family: signing in on a phone must not be
        // collateral damage when the laptop's session is revoked for theft.
        // No lock needed — a brand-new `family_id` has no other writer.
        return this.issueTokenPair(this.prisma, {
            user,
            familyId: randomUUID(),
            meta,
        });
    }

    // Exchange a refresh token for a fresh pair. Every successful rotation
    // invalidates the token that was presented — that single-use property is
    // what makes a stolen token detectable.
    async rotateRefreshToken(
        rawToken: string | null,
        meta: SessionMeta = {},
    ): Promise<TokenPair> {
        if (!rawToken) {
            throw new UnauthorizedException();
        }

        // Only to learn *which* family to lock. `family_id` and `user_id` never
        // change once a row is written, so reading them outside the lock is
        // safe; every field the decision below turns on (`revoked_at`,
        // `expires_at`) is re-read under it.
        const presented = await this.prisma.refresh_tokens.findUnique({
            where: { token_hash: this.hashRefreshToken(rawToken) },
        });
        if (!presented) {
            throw new UnauthorizedException();
        }

        // Deliberately outside the transaction. It reads `users`, not this
        // family, so it is not part of the invariant the lock protects, and
        // holding a row lock across an unrelated query would lengthen the
        // critical section every concurrent rotation has to wait behind.
        const user = await this.readActiveUser(presented.user_id);

        // `null` means "something was revoked and the caller gets a 401". The
        // failure paths cannot simply throw from inside the callback: an
        // exception rolls the transaction back, which would undo the very
        // revocation being performed — theft detection would then revoke the
        // family and immediately give it back.
        const pair = await this.prisma.$transaction(async (tx) => {
            const family = await this.lockFamily(tx, presented.family_id);
            const stored = family.find(
                (row) => Number(row.id) === presented.id,
            );
            if (!stored) {
                return null;
            }

            const now = new Date();

            if (stored.revoked_at) {
                if (!this.isBenignRotationRace(stored.revoked_at, family, now)) {
                    // Either the reuse is too old to be a race, or the session
                    // is already over. We cannot tell a replayed copy from the
                    // honest client holding the same value, so the whole family
                    // goes.
                    await this.revokeFamilyLocked(tx, presented.family_id);
                    return null;
                }
                // Benign race — fall through and issue a new pair in this
                // family. Reaching here under the lock means the winner has
                // already committed its successor, so the liveness test above
                // saw it. That is what stops an honest second tab being told
                // its session is dead.
            }

            if (stored.expires_at.getTime() <= now.getTime()) {
                // Just expired, not stolen — kill this row, leave the family
                // alone.
                await this.revokeToken(tx, presented.id);
                return null;
            }

            if (!user) {
                await this.revokeFamilyLocked(tx, presented.family_id);
                return null;
            }

            if (!stored.revoked_at) {
                // Unconditional on purpose. `stored` came from the locking read
                // above and no other writer can revoke it while this
                // transaction holds the family lock, so the conditional
                // `updateMany` Phase 1.5.4 used has nothing left to guard
                // against — the lock, not the WHERE clause, is what makes this
                // safe now.
                await this.revokeToken(tx, presented.id);
            }

            // Inside the transaction, so the revoke above and this insert commit
            // together. That is the whole point of 1.6.1: a logout can no longer
            // land between them, see an empty family, report success, and then
            // be undone by the successor appearing a moment later.
            return this.issueTokenPair(tx, {
                user,
                familyId: presented.family_id,
                meta,
            });
        });

        if (!pair) {
            throw new UnauthorizedException();
        }
        return pair;
    }

    // Logout is authenticated by the cookie itself, so an expired access token
    // still ends the session properly. An unknown token is not an error: the
    // desired end state (this browser holds no live session) already holds.
    //
    // The revocation goes through `revokeFamily`, which takes the family lock —
    // so a logout racing a rotation now waits for that rotation to commit and
    // then revokes its successor too, instead of revoking an empty family.
    async logout(rawToken: string | null): Promise<void> {
        if (!rawToken) {
            return;
        }
        const stored = await this.prisma.refresh_tokens.findUnique({
            where: { token_hash: this.hashRefreshToken(rawToken) },
        });
        if (!stored) {
            return;
        }
        await this.revokeFamily(stored.family_id);
    }

    // Ends one session (one device / one rotation chain).
    //
    // Takes the family lock, and must: a transaction around rotation alone would
    // exclude nothing, because the writer rotation needs to be excluded *by* is
    // this one. Revoking without the lock is what let a logout slip between a
    // rotation's revoke and its insert, revoke an empty family, and report a
    // success the successor then quietly undid.
    async revokeFamily(familyId: string): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            await this.lockFamily(tx, familyId);
            await this.revokeFamilyLocked(tx, familyId);
        });
    }

    // Ends every session a user has. Not wired to anything yet; Phase 3 calls it
    // on password change, and it is what an admin "cerrar sesiones" action would
    // use.
    //
    // Locks by `user_id` rather than by family: a user's rows are a superset of
    // any one family's, so this contends on the same physical rows as
    // `lockFamily` and the two serialize correctly.
    async revokeAllForUser(userId: number): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            await tx.$queryRaw`
                SELECT id
                FROM refresh_tokens
                WHERE user_id = ${userId}
                FOR UPDATE
            `;
            const now = new Date();
            await tx.refresh_tokens.updateMany({
                data: { revoked_at: now, updated_at: now },
                where: { user_id: userId, revoked_at: null },
            });
        });
    }

    // Locks every row of one family for the rest of the caller's transaction and
    // returns their current state. Two jobs in one statement on purpose:
    //
    // A locking read returns the latest committed rows, but a *plain* read
    // afterwards would be served from this transaction's REPEATABLE READ
    // snapshot and could still show the pre-lock state. Reading the columns the
    // caller needs directly out of the `FOR UPDATE` result sidesteps that
    // entirely, so the decision is provably made on post-lock data.
    private async lockFamily(
        tx: PrismaClientLike,
        familyId: string,
    ): Promise<LockedFamilyRow[]> {
        return tx.$queryRaw<LockedFamilyRow[]>`
            SELECT id, revoked_at, expires_at
            FROM refresh_tokens
            WHERE family_id = ${familyId}
            FOR UPDATE
        `;
    }

    // Assumes the caller already holds the family lock. Split from
    // `revokeFamily` so rotation can revoke inside the transaction it is already
    // holding instead of deadlocking against itself.
    private async revokeFamilyLocked(
        tx: PrismaClientLike,
        familyId: string,
    ): Promise<void> {
        const now = new Date();
        await tx.refresh_tokens.updateMany({
            data: { revoked_at: now, updated_at: now },
            where: { family_id: familyId, revoked_at: null },
        });
    }

    // `client` is `this.prisma` on the login path and the open transaction on the
    // rotation path, so the successor row is written inside whatever unit of work
    // the caller established.
    private async issueTokenPair(
        client: PrismaClientLike,
        {
            user,
            familyId,
            meta,
        }: {
            user: TokenSubject;
            familyId: string;
            meta: SessionMeta;
        },
    ): Promise<TokenPair> {
        // Opaque random bytes, not a JWT. A refresh token carries no claims —
        // its only job is to name a row in the database, and that row is the
        // authority. That is precisely what lets us revoke it, which a JWT
        // cannot do.
        const refreshToken = randomBytes(64).toString('base64url');
        const now = new Date();
        const refreshExpiresAt = new Date(
            now.getTime() + jwtConstants.refreshTtlDays * 24 * 60 * 60 * 1000,
        );

        await client.refresh_tokens.create({
            data: {
                user_id: user.id,
                token_hash: this.hashRefreshToken(refreshToken),
                family_id: familyId,
                expires_at: refreshExpiresAt,
                created_at: now,
                updated_at: now,
                user_agent: meta.userAgent ? meta.userAgent.slice(0, 255) : null,
                ip: meta.ip ? meta.ip.slice(0, 45) : null,
            },
        });

        return {
            accessToken: this.signAccessToken(user),
            refreshToken,
            refreshExpiresAt,
        };
    }

    private signAccessToken(user: TokenSubject): string {
        const payload: AccessTokenPayload = {
            sub: user.id,
            email: user.email,
            role_ids: user.user_roles
                .map((userRole) => userRole.role_id)
                .filter((roleId): roleId is number => roleId != null),
        };
        return this.jwtService.sign(payload);
    }

    // Re-read the user on every rotation instead of trusting the refresh row.
    // This is the point where deactivating a user or revoking a role actually
    // takes effect: at most one access-token lifetime after the change, rather
    // than never.
    //
    // Its own method because `auth.service.test.ts` spies on it to interleave a
    // competing operation into a rotation. Since 1.6.1 it runs *before* the
    // family lock is taken, so that seam is a pre-lock one: those tests show the
    // rotation makes the right decision when it finds the family already
    // changed. The seam *inside* the critical section is `issueTokenPair`.
    private async readActiveUser(userId: number) {
        return this.prisma.users.findFirst({
            include: { user_roles: { where: { active: 1 } } },
            where: { id: userId, active: 1 },
        });
    }

    // The one decision that separates "two tabs raced" from "this session was
    // deliberately ended", used by both places that can find a revoked row: the
    // client re-presenting an already-spent token, and a rotation that lost the
    // race to revoke its own row. They must never drift apart — treating a
    // logout as a race resurrects the session, and treating a race as a logout
    // signs honest users out.
    //
    // A race always leaves a *live successor* in the family, because the request
    // that won it inserted one. Logout, theft revocation and `revokeAllForUser`
    // revoke every row instead, so an empty family is the signal that the
    // session is over.
    // Takes the locked family rows rather than querying: they are the post-lock
    // truth, and re-reading here would reintroduce exactly the snapshot problem
    // `lockFamily` exists to avoid. Synchronous as a result.
    private isBenignRotationRace(
        revokedAt: Date,
        family: LockedFamilyRow[],
        now: Date,
    ): boolean {
        const revokedMsAgo = now.getTime() - revokedAt.getTime();
        if (revokedMsAgo > jwtConstants.refreshReuseGraceSeconds * 1000) {
            return false;
        }
        return family.some(
            (row) => !row.revoked_at && row.expires_at.getTime() > now.getTime(),
        );
    }

    private async revokeToken(
        client: PrismaClientLike,
        id: number,
    ): Promise<void> {
        const now = new Date();
        await client.refresh_tokens.update({
            data: { revoked_at: now, updated_at: now },
            where: { id },
        });
    }

    // SHA-256 rather than bcrypt on purpose: the input is 64 bytes of entropy,
    // not a human password, so there is nothing to brute-force and the lookup
    // must be a plain indexed equality check. Storing the digest means a leaked
    // database dump contains no usable session.
    private hashRefreshToken(rawToken: string): string {
        return createHash('sha256').update(rawToken).digest('hex');
    }
}
