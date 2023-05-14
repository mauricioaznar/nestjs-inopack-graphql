import { AccountsService } from '../../../../modules/sales/accounts/accounts.service';
import { Account } from '../../../dto/entities';
import { INestApplication } from '@nestjs/common';

export async function createAccountForTesting({
    app,
}: {
    app: INestApplication;
}): Promise<Account> {
    const accountsService = app.get(AccountsService);
    try {
        return await accountsService.upsertAccount({
            name: 'Name',
            abbreviation: 'abbr',
            account_contacts: [],
        });
    } catch (e) {
        console.error(e);
    }

    throw new Error('createAccountForTesting failed');
}
