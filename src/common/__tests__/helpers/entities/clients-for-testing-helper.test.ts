import { setupApp } from '../setup-app';
import { INestApplication } from '@nestjs/common';
import { createClientForTesting } from './clients-for-testing-helper';
import { ClientsService } from '../../../../modules/entities/sales/clients/clients.service';

let app: INestApplication;
let clientsService: ClientsService;

beforeAll(async () => {
    app = await setupApp();
    clientsService = app.get(ClientsService);
});

afterAll(async () => {
    await app.close();
});

it('create client for testing returns a client', async () => {
    const client = await createClientForTesting({
        clientsService,
    });

    expect(client).toBeTruthy();
    expect(client.id).toBeTruthy();
});
