import { ClientsService } from '../../../../modules/sales/clients/clients.service';
import { Client } from '../../../dto/entities';
import { INestApplication } from '@nestjs/common';

export async function createClientForTesting({
    app,
}: {
    app: INestApplication;
}): Promise<Client> {
    const clientsService = app.get(ClientsService);
    try {
        return await clientsService.upsertClient({
            name: 'Name',
            abbreviation: 'abbr',
            client_contacts: [],
        });
    } catch (e) {
        console.error(e);
    }

    throw new Error('createClientForTesting failed');
}
