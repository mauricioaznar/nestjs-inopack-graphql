import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
    AccessToken,
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

    // Legacy GraphQL entry point: access token only, no refresh cookie. A
    // GraphQL mutation cannot set an httpOnly cookie through the upload link,
    // which is exactly why login moved to REST (`POST /auth/login`). Kept for
    // the cutover window only — delete it with the frontend's generated
    // `useLoginMutation` once Phase 1 has been exercised, and before Phase 2,
    // whose login throttling is applied to the REST route and would be bypassed
    // by this one.
    async login(userInput: LoginInput): Promise<AccessToken> {
        const user = await this.validateUser(userInput);
        if (!user) {
            throw new BadRequestException(
                'Could not log-in with the provided credentials',
            );
        }
        return { accessToken: this.signAccessToken(user) };
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
            const revokedMsAgo = now.getTime() - stored.revoked_at.getTime();
            const isWithinGrace =
                revokedMsAgo <= jwtConstants.refreshReuseGraceSeconds * 1000;

            // The grace window only covers one situation: two tabs sharing a
            // cookie, one of which rotated a moment ago. That situation always
            // leaves a *live successor* in the family. Logout, theft revocation
            // and `revokeAllForUser` kill every row instead, so a dead family is
            // how we tell "benign race" from "this session was deliberately
            // ended" — without it, a logout could be undone by a stale tab, and
            // theft detection would hand the thief a fresh pair.
            const familyIsStillLive = isWithinGrace
                ? (await this.prisma.refresh_tokens.count({
                      where: {
                          family_id: stored.family_id,
                          revoked_at: null,
                          expires_at: { gt: now },
                      },
                  })) > 0
                : false;

            if (!familyIsStillLive) {
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

        // Re-read the user on every rotation instead of trusting the row. This
        // is the point where deactivating a user or revoking a role actually
        // takes effect: at most one access-token lifetime after the change,
        // rather than never.
        const user = await this.prisma.users.findFirst({
            include: { user_roles: { where: { active: 1 } } },
            where: { id: stored.user_id, active: 1 },
        });
        if (!user) {
            await this.revokeFamily(stored.family_id);
            throw new UnauthorizedException();
        }

        if (!stored.revoked_at) {
            await this.revokeToken(stored.id);
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
