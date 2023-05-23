import { AccountsService } from '../../../../modules/management/accounts/accounts.service';
import { Account } from '../../../dto/entities';
import { INestApplication } from '@nestjs/common';
import { clientAccountType } from '../../objects/management/account-types';

export async function createClientForTesting({
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
            account_type_id: clientAccountType.id,
        });
    } catch (e) {
        console.error(e);
    }

    throw new Error('createAccountForTesting failed');
}
