import { INestApplication } from '@nestjs/common';
import { UserService } from './user.service';
import { setupApp } from '../../common/__tests__/helpers/setup-app';
import { AuthService } from './auth.service';
import { roles } from '../../common/__tests__/objects/auth/roles';

let app: INestApplication;
let userService: UserService;
let authService: AuthService;

beforeAll(async () => {
    app = await setupApp();
    userService = app.get(UserService);
    authService = app.get(AuthService);
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
