import { setupApp } from '../setup-app';
import { INestApplication } from '@nestjs/common';
import { createClientForTesting } from './clients-for-testing-helper';

let app: INestApplication;

beforeAll(async () => {
    app = await setupApp();
});

afterAll(async () => {
    await app.close();
});

it('create client for testing returns a client', async () => {
    const client = await createClientForTesting({
        app,
    });

    expect(client).toBeTruthy();
    expect(client.id).toBeTruthy();
});
