import { INestApplication } from '@nestjs/common';
import { UserService } from './user.service';
import { setupApp } from '../../common/__tests__/helpers/setup-app';
import { AuthService } from './auth.service';
import { roles } from '../../common/__tests__/objects/auth/roles';
import { PrismaService } from '../../common/modules/prisma/prisma.service';
import { createHash } from 'crypto';
import { jwtConstants } from '../../common/constants/jwt';

// The service stores a digest, never the raw token, so the tests have to hash
// the same way to look a row up.
function sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
}

let app: INestApplication;
let userService: UserService;
let authService: AuthService;
let prisma: PrismaService;

beforeAll(async () => {
    app = await setupApp();
    userService = app.get(UserService);
    authService = app.get(AuthService);
    prisma = app.get(PrismaService);
});

afterAll(async () => {
    await app.close();
});

describe('validates user', () => {
    it('returns user with roles if user is valid', async () => {
        const user = await userService.create({
            email: 'validateuservalidemail@email.com',
            first_name: 'first name 1',
            last_name: 'last name 2',
            password: 'password123',
            roles: roles,
        });

        const userWithRoles = await authService.validateUser({
            email: user.email,
            password: 'password123',
        });

        expect(userWithRoles).toBeDefined();
        expect(userWithRoles?.id).toBeDefined();
        expect(Array.isArray(userWithRoles?.user_roles)).toBe(true);
    });

    it('returns null if user is not valid', async () => {
        const userWithRoles = await authService.validateUser({
            email: 'nonexistentuseremail@email.com',
            password: 'randompassword',
        });

        expect(userWithRoles).toBeFalsy();
    });

    it('returns null if the user is deactivated', async () => {
        const user = await userService.create({
            email: 'deactivateduser@email.com',
            first_name: 'first name 1',
            last_name: 'last name 2',
            password: 'password123',
            roles: roles,
        });

        // Soft-delete convention: live rows are `active = 1`.
        await prisma.users.update({
            data: { active: -1 },
            where: { id: user.id },
        });

        const userWithRoles = await authService.validateUser({
            email: user.email,
            password: 'password123',
        });

        expect(userWithRoles).toBeFalsy();
    });

    it('excludes revoked role assignments from the token roles', async () => {
        const user = await userService.create({
            email: 'revokedroleuser@email.com',
            first_name: 'first name 1',
            last_name: 'last name 2',
            password: 'password123',
            roles: roles,
        });

        await prisma.user_roles.updateMany({
            data: { active: -1 },
            where: { user_id: user.id },
        });

        const userWithRoles = await authService.validateUser({
            email: user.email,
            password: 'password123',
        });

        expect(userWithRoles?.user_roles).toHaveLength(0);
    });
});

describe('logins user', () => {
    it('returns accessToken if user is valid', async () => {
        await userService.create({
            email: 'loginuseremail@email.com',
            first_name: 'first name 1',
            last_name: 'last name 2',
            password: 'password123',
            roles: roles,
        });

        const { accessToken } = await authService.login({
            email: 'loginuseremail@email.com',
            password: 'password123',
        });

        expect(typeof accessToken).toBe('string');
    });

    it('fails if user credentials are not valid', async () => {
        expect.hasAssertions();

        try {
            await authService.login({
                email: 'loginuserinvalidemail@email.com',
                password: 'password123',
            });
        } catch (e) {
            expect(e.response.message).toMatch(/provided credentials/i);
        }
    });
});

describe('refresh tokens', () => {
    async function createUserAndLogin(email: string) {
        await userService.create({
            email,
            first_name: 'first name 1',
            last_name: 'last name 2',
            password: 'password123',
            roles: roles,
        });
        return authService.loginWithCredentials({
            email,
            password: 'password123',
        });
    }

    it('issues a refresh token alongside the access token on login', async () => {
        const pair = await createUserAndLogin('refreshlogin@email.com');

        expect(typeof pair.accessToken).toBe('string');
        expect(typeof pair.refreshToken).toBe('string');
        expect(pair.refreshExpiresAt.getTime()).toBeGreaterThan(Date.now());

        // The raw token must never be what is stored.
        const stored = await prisma.refresh_tokens.findFirst({
            where: { token_hash: sha256(pair.refreshToken) },
        });
        expect(stored).toBeTruthy();
        expect(stored?.revoked_at).toBeNull();
    });

    it('rotates: a refresh returns a new pair and spends the old token', async () => {
        const first = await createUserAndLogin('refreshrotate@email.com');

        const second = await authService.rotateRefreshToken(first.refreshToken);

        expect(second.refreshToken).not.toEqual(first.refreshToken);

        const oldRow = await prisma.refresh_tokens.findFirst({
            where: { token_hash: sha256(first.refreshToken) },
        });
        const newRow = await prisma.refresh_tokens.findFirst({
            where: { token_hash: sha256(second.refreshToken) },
        });

        expect(oldRow?.revoked_at).not.toBeNull();
        expect(newRow?.revoked_at).toBeNull();
        // Rotation stays inside the same session.
        expect(newRow?.family_id).toEqual(oldRow?.family_id);
    });

    it('reusing a rotated refresh token revokes the whole family', async () => {
        // Relies on REFRESH_REUSE_GRACE_SECONDS=0 in .env.test — with the
        // production grace window this reuse would read as two tabs racing.
        const first = await createUserAndLogin('refreshtheft@email.com');
        const second = await authService.rotateRefreshToken(first.refreshToken);

        await expect(
            authService.rotateRefreshToken(first.refreshToken),
        ).rejects.toThrow();

        // The token the honest client is holding must die too — that is the
        // point: we cannot tell victim from thief, so the session ends.
        const secondRow = await prisma.refresh_tokens.findFirst({
            where: { token_hash: sha256(second.refreshToken) },
        });
        expect(secondRow).toBeTruthy();

        const live = await prisma.refresh_tokens.count({
            where: { family_id: secondRow?.family_id, revoked_at: null },
        });
        expect(live).toBe(0);

        await expect(
            authService.rotateRefreshToken(second.refreshToken),
        ).rejects.toThrow();
    });

    describe('reuse grace window', () => {
        // `.env.test` pins the grace to 0 so the theft test above asserts the
        // strict rule. These two re-open it to cover the production default:
        // `jwtConstants` is read per call, so mutating it is a legitimate seam.
        const original = jwtConstants.refreshReuseGraceSeconds;

        beforeEach(() => {
            jwtConstants.refreshReuseGraceSeconds = 30;
        });

        afterEach(() => {
            jwtConstants.refreshReuseGraceSeconds = original;
        });

        it('treats an immediate reuse as two tabs racing, not as theft', async () => {
            const first = await createUserAndLogin('refreshgrace@email.com');
            const second = await authService.rotateRefreshToken(
                first.refreshToken,
            );

            // The second tab was still holding the pre-rotation token.
            const third = await authService.rotateRefreshToken(
                first.refreshToken,
            );

            expect(third.accessToken).toBeTruthy();
            // The token the first tab received must survive: killing it is
            // exactly the false positive this window exists to prevent.
            await expect(
                authService.rotateRefreshToken(second.refreshToken),
            ).resolves.toBeTruthy();
        });

        it('does not let the grace window resurrect a logged-out session', async () => {
            // The window only covers a race, which always leaves a live token in
            // the family. Logout revokes every row, so there is nothing to race
            // with and the reuse must fail even though it is "recent".
            const pair = await createUserAndLogin('refreshgracelogout@email.com');
            await authService.logout(pair.refreshToken);

            await expect(
                authService.rotateRefreshToken(pair.refreshToken),
            ).rejects.toThrow();
        });
    });

    it('rejects an expired refresh token', async () => {
        const pair = await createUserAndLogin('refreshexpired@email.com');

        await prisma.refresh_tokens.updateMany({
            data: { expires_at: new Date(Date.now() - 1000) },
            where: { token_hash: sha256(pair.refreshToken) },
        });

        await expect(
            authService.rotateRefreshToken(pair.refreshToken),
        ).rejects.toThrow();
    });

    it('rejects an unknown or missing refresh token', async () => {
        await expect(
            authService.rotateRefreshToken('not-a-real-token'),
        ).rejects.toThrow();
        await expect(authService.rotateRefreshToken(null)).rejects.toThrow();
    });

    it('stops rotating once the user is deactivated', async () => {
        const email = 'refreshdeactivated@email.com';
        const pair = await createUserAndLogin(email);

        await prisma.users.updateMany({
            data: { active: -1 },
            where: { email },
        });

        // The access token already issued stays valid until it expires — that is
        // the cost of stateless JWTs — but the session cannot be renewed.
        await expect(
            authService.rotateRefreshToken(pair.refreshToken),
        ).rejects.toThrow();
    });

    it('logout revokes the session server-side', async () => {
        const pair = await createUserAndLogin('refreshlogout@email.com');

        await authService.logout(pair.refreshToken);

        await expect(
            authService.rotateRefreshToken(pair.refreshToken),
        ).rejects.toThrow();
    });

    it('logout on an unknown token is a no-op', async () => {
        await expect(
            authService.logout('not-a-real-token'),
        ).resolves.toBeUndefined();
        await expect(authService.logout(null)).resolves.toBeUndefined();
    });

    it('revokeAllForUser ends every session the user has', async () => {
        const email = 'refreshallsessions@email.com';
        const first = await createUserAndLogin(email);
        // A second login is a second device: its own family.
        const second = await authService.loginWithCredentials({
            email,
            password: 'password123',
        });

        const user = await prisma.users.findFirst({ where: { email } });
        expect(user).toBeTruthy();
        await authService.revokeAllForUser(Number(user?.id));

        await expect(
            authService.rotateRefreshToken(first.refreshToken),
        ).rejects.toThrow();
        await expect(
            authService.rotateRefreshToken(second.refreshToken),
        ).rejects.toThrow();
    });

    it('a new login starts a separate family, so revoking one leaves the other alone', async () => {
        const email = 'refreshfamilies@email.com';
        const laptop = await createUserAndLogin(email);
        const phone = await authService.loginWithCredentials({
            email,
            password: 'password123',
        });

        await authService.logout(laptop.refreshToken);

        await expect(
            authService.rotateRefreshToken(laptop.refreshToken),
        ).rejects.toThrow();
        await expect(
            authService.rotateRefreshToken(phone.refreshToken),
        ).resolves.toBeTruthy();
    });
});
