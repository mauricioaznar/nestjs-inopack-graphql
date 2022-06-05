import { setupApp } from '../../../../common/__tests__/helpers/setup-app';
import { INestApplication } from '@nestjs/common';
import { ClientsService } from './clients.service';

let app: INestApplication;
let clientsService: ClientsService;

beforeAll(async () => {
    app = await setupApp();
    clientsService = app.get(ClientsService);
});

afterAll(async () => {
    await app.close();
});

describe('client list', () => {
    it('returns list', async () => {
        const clients = await clientsService.getClients();
        expect(Array.isArray(clients)).toBe(true);
    });
});

describe('client upsert', () => {
    it('creates client', async () => {
        const client = await clientsService.upsertClient({
            abbreviation: 'ADB',
            name: 'A D B',
            client_contacts: [
                {
                    email: 'email@gmail.com',
                    cellphone: '9993516898',
                    first_name: 'ffirst name',
                    last_name: 'second name',
                },
            ],
        });

        expect(client.id).toBeDefined();
        expect(client.abbreviation).toBe('ADB');
        expect(client.name).toBe('A D B');

        const clientContacts = await clientsService.getClientContacts({
            client_id: client.id,
        });

        expect(clientContacts.length).toBe(1);
    });
});

describe('gets client', () => {
    //
});

describe('deletes client', () => {
    //
});
