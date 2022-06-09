import { ClientsService } from '../../../../modules/entities/sales/clients/clients.service';
import { Client } from '../../../dto/entities';

export async function createClientForTesting({
    clientsService,
}: {
    clientsService: ClientsService;
}): Promise<Client> {
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
