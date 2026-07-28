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
        return this.issueTokenPair({
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

        const stored = await this.prisma.refresh_tokens.findUnique({
            where: { token_hash: this.hashRefreshToken(rawToken) },
        });
        if (!stored) {
            throw new UnauthorizedException();
        }

        const now = new Date();

        if (stored.revoked_at) {
            if (
                !(await this.isBenignRotationRace(
                    stored.revoked_at,
                    stored.family_id,
                    now,
                ))
            ) {
                // Either the reuse is too old to be a race, or the session is
                // already over. We cannot tell a replayed copy from the honest
                // client holding the same value, so the whole family goes.
                await this.revokeFamily(stored.family_id);
                throw new UnauthorizedException();
            }
            // Benign race — fall through and issue a new pair in this family.
        }

        if (stored.expires_at.getTime() <= now.getTime()) {
            // Just expired, not stolen — kill this row, leave the family alone.
            await this.revokeToken(stored.id);
            throw new UnauthorizedException();
        }

        const user = await this.readActiveUser(stored.user_id);
        if (!user) {
            await this.revokeFamily(stored.family_id);
            throw new UnauthorizedException();
        }

        if (!stored.revoked_at) {
            // Conditional, not a plain update: `logout` can revoke this row —
            // and with it the whole family — between the read at the top of this
            // method and this write. An unconditional revoke would then insert a
            // live successor into a dead family, and the session the user just
            // ended would come back. `count === 1` means this request won the
            // race and owns the successor.
            const { count } = await this.prisma.refresh_tokens.updateMany({
                data: { revoked_at: now, updated_at: now },
                where: { id: stored.id, revoked_at: null },
            });

            if (count === 0) {
                // Somebody else revoked the row first. Deliberately *not* an
                // automatic 401: a concurrent rotation from a second tab is the
                // same benign race the branch above forgives, and telling that
                // tab its session is dead is exactly the false positive the
                // grace window exists to prevent. So re-read and apply the same
                // decision — a rotation leaves a live successor and this request
                // falls through to get its own pair; a logout leaves nothing
                // live and this correctly fails.
                const current = await this.prisma.refresh_tokens.findUnique({
                    where: { id: stored.id },
                });
                if (
                    !current?.revoked_at ||
                    !(await this.isBenignRotationRace(
                        current.revoked_at,
                        current.family_id,
                        new Date(),
                    ))
                ) {
                    throw new UnauthorizedException();
                }
            }
        }

        return this.issueTokenPair({
            user,
            familyId: stored.family_id,
            meta,
        });
    }

    // Logout is authenticated by the cookie itself, so an expired access token
    // still ends the session properly. An unknown token is not an error: the
    // desired end state (this browser holds no live session) already holds.
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
    async revokeFamily(familyId: string): Promise<void> {
        await this.prisma.refresh_tokens.updateMany({
            data: { revoked_at: new Date(), updated_at: new Date() },
            where: { family_id: familyId, revoked_at: null },
        });
    }

    // Ends every session a user has. Not wired to anything yet; Phase 3 calls it
    // on password change, and it is what an admin "cerrar sesiones" action would
    // use.
    async revokeAllForUser(userId: number): Promise<void> {
        await this.prisma.refresh_tokens.updateMany({
            data: { revoked_at: new Date(), updated_at: new Date() },
            where: { user_id: userId, revoked_at: null },
        });
    }

    private async issueTokenPair({
        user,
        familyId,
        meta,
    }: {
        user: TokenSubject;
        familyId: string;
        meta: SessionMeta;
    }): Promise<TokenPair> {
        // Opaque random bytes, not a JWT. A refresh token carries no claims —
        // its only job is to name a row in the database, and that row is the
        // authority. That is precisely what lets us revoke it, which a JWT
        // cannot do.
        const refreshToken = randomBytes(64).toString('base64url');
        const now = new Date();
        const refreshExpiresAt = new Date(
            now.getTime() + jwtConstants.refreshTtlDays * 24 * 60 * 60 * 1000,
        );

        await this.prisma.refresh_tokens.create({
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
    // Its own method rather than an inline query because it is the last read
    // before the successor is written — i.e. the seam the concurrency test in
    // `auth.service.test.ts` opens to reproduce "logout landed mid-rotation".
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
    private async isBenignRotationRace(
        revokedAt: Date,
        familyId: string,
        now: Date,
    ): Promise<boolean> {
        const revokedMsAgo = now.getTime() - revokedAt.getTime();
        if (revokedMsAgo > jwtConstants.refreshReuseGraceSeconds * 1000) {
            return false;
        }
        return (
            (await this.prisma.refresh_tokens.count({
                where: {
                    family_id: familyId,
                    revoked_at: null,
                    expires_at: { gt: now },
                },
            })) > 0
        );
    }

    private async revokeToken(id: number): Promise<void> {
        await this.prisma.refresh_tokens.update({
            data: { revoked_at: new Date(), updated_at: new Date() },
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
