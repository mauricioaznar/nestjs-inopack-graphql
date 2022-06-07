import { INestApplication } from '@nestjs/common';
import { UserService } from './user.service';
import { setupApp } from '../../common/__tests__/helpers/setup-app';

let app: INestApplication;
let userService: UserService;

beforeAll(async () => {
    app = await setupApp();
    userService = app.get(UserService);
});

afterAll(async () => {
    await app.close();
});

describe('users list', () => {
    it('returns list', async () => {
        const users = await userService.findAll();

        expect(Array.isArray(users)).toBe(true);
    });
});

describe('users upsert', () => {
    it('creates user and doesnt return password', async () => {
        const user = await userService.create({
            email: 'createuseremail@email.com',
            first_name: 'first name',
            last_name: 'last name',
            password: 'thissiaapassword',
        });

        expect(user.email).toBe('createuseremail@email.com');
        expect(user.first_name).toBe('first name');
        expect(user.last_name).toBe('last name');
        expect(user.fullname).toBe('first name last name');
    });

    it('doesnt allow to create a user when email is already occupied', async () => {
        await userService.create({
            email: 'doesntallowcreateonunique@email.com',
            first_name: 'first name',
            last_name: 'last name',
            password: 'thissiaapassword',
        });

        try {
            await userService.create({
                email: 'doesntallowcreateonunique@email.com',
                first_name: 'first name',
                last_name: 'last name',
                password: 'thissiaapassword',
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/email is already/i),
                ]),
            );
        }
    });

    it('updates client', async () => {
        const createdUser = await userService.create({
            email: 'create2useremail@email.com',
            first_name: 'first name',
            last_name: 'last name',
            password: 'thissiaapassword',
        });

        const user = await userService.update({
            id: createdUser.id,
            email: 'updateuseremail@email.com',
            first_name: 'first name 2',
            last_name: 'last name 2',
            password: 'thissiaapassword',
        });

        expect(createdUser.id).toBe(user.id);
        expect(user.email).toBe('updateuseremail@email.com');
        expect(user.first_name).toBe('first name 2');
        expect(user.last_name).toBe('last name 2');
        expect(user.fullname).toBe('first name 2 last name 2');
    });

    it('allows to update a user when email is the same the previous one', async () => {
        const createdUser = await userService.create({
            email: 'allowspreviousemail@email.com',
            first_name: 'first name',
            last_name: 'last name',
            password: 'thissiaapassword',
        });

        const updatedUser = await userService.update({
            id: createdUser.id,
            email: 'allowspreviousemail@email.com',
            first_name: 'first name',
            last_name: 'last name',
            password: 'thissiaapassword',
        });

        expect(updatedUser.id).toEqual(createdUser.id);
    });
});

describe('gets', () => {
    it('gets user by email', async () => {
        const createdUser = await userService.create({
            email: 'getsuserbyemail@email.com',
            first_name: 'first name',
            last_name: 'last name',
            password: 'thissiaapassword',
        });

        const user = await userService.findOneByEmail({
            email: 'getsuserbyemail@email.com',
        });

        expect(createdUser.id).toBe(user?.id);
        expect(user?.email).toBe('getsuserbyemail@email.com');
    });

    it('gets user by id', async () => {
        const createdUser = await userService.create({
            email: 'getsuserbyid@email.com',
            first_name: 'first name',
            last_name: 'last name',
            password: 'thissiaapassword',
        });

        const user = await userService.findUser({
            user_id: createdUser.id,
        });

        expect(createdUser.id).toBe(user?.id);
    });
});
