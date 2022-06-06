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
        expect(clientContacts).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    first_name: expect.stringMatching(/ffirst/i),
                }),
            ]),
        );
    });

    it('updates client', async () => {
        const createdClient = await clientsService.upsertClient({
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

        const updatedClient = await clientsService.upsertClient({
            id: createdClient.id,
            name: 'New name',
            abbreviation: 'New abbr',
            client_contacts: [],
        });
        expect(updatedClient.name).toBe('New name');
        expect(updatedClient.abbreviation).toBe('New abbr');

        const clientContacts = await clientsService.getClientContacts({
            client_id: updatedClient.id,
        });

        expect(clientContacts.length).toBe(0);
    });
});

describe('gets client', () => {
    it('returns client', async () => {
        const createdClient = await clientsService.upsertClient({
            name: 'Name',
            abbreviation: 'Abbr',
            client_contacts: [],
        });

        const client = await clientsService.getClient({
            client_id: createdClient.id,
        });

        expect(client?.abbreviation).toBe('Abbr');
        expect(client?.name).toBe('Name');
    });
});

describe('deletes client', () => {
    it('deletes client and its client contacts', async () => {
        const createdClient = await clientsService.upsertClient({
            abbreviation: 'Abbr',
            name: 'Name',
            client_contacts: [
                {
                    email: 'email@email.com',
                    last_name: 'last_nae',
                    first_name: 'first name',
                    cellphone: '9999884433',
                },
            ],
        });

        await clientsService.deletesClient({
            client_id: createdClient.id,
        });

        const clientContacts = await clientsService.getClientContacts({
            client_id: createdClient.id,
        });

        const client = await clientsService.getClient({
            client_id: createdClient.id,
        });

        expect(client).toBeFalsy();
        expect(clientContacts.length).toBe(0);
    });

    it.todo(
        'forbids to delete client when there is are related order requests',
    );
});
