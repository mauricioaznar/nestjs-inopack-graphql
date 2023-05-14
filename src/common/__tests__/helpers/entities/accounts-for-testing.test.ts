import { setupApp } from '../setup-app';
import { INestApplication } from '@nestjs/common';
import { createAccountForTesting } from './accounts-for-testing';

let app: INestApplication;

beforeAll(async () => {
    app = await setupApp();
});

afterAll(async () => {
    await app.close();
});

it('create account for testing returns a account', async () => {
    const account = await createAccountForTesting({
        app,
    });

    expect(account).toBeTruthy();
    expect(account.id).toBeTruthy();
});
