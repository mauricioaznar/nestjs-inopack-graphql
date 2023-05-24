import {
    createProductForTesting,
    setupApp,
} from '../../../common/__tests__/helpers';
import { INestApplication } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { createOrderRequestWithOneProduct } from '../../../common/__tests__/helpers/entities/order-requests-for-testing';
import { clientAccountType } from '../../../common/__tests__/objects/management/account-types';

let app: INestApplication;
let accountsService: AccountsService;
let currentOrderRequestCode = 30000;

beforeAll(async () => {
    app = await setupApp();
    accountsService = app.get(AccountsService);
    currentOrderRequestCode = currentOrderRequestCode + 1;
});

afterAll(async () => {
    await app.close();
});

describe('account list', () => {
    it('returns list', async () => {
        const accounts = await accountsService.getAccounts({
            accountsQueryArgs: {
                account_type_id: null,
            },
        });
        expect(Array.isArray(accounts)).toBe(true);
    });
});

describe('account upsert', () => {
    it('creates account', async () => {
        const account = await accountsService.upsertAccount({
            abbreviation: 'ADB',
            name: 'A D B',
            account_contacts: [
                {
                    email: 'email@gmail.com',
                    cellphone: '9993516898',
                    first_name: 'ffirst name',
                    last_name: 'second name',
                },
            ],
            account_type_id: clientAccountType.id,
        });

        expect(account.id).toBeDefined();
        expect(account.abbreviation).toBe('ADB');
        expect(account.name).toBe('A D B');

        const accountContacts = await accountsService.getAccountContacts({
            account_id: account.id,
        });

        expect(accountContacts.length).toBe(1);
        expect(accountContacts).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    first_name: expect.stringMatching(/ffirst/i),
                }),
            ]),
        );
    });

    it('updates account', async () => {
        const createdAccount = await accountsService.upsertAccount({
            abbreviation: 'ADB',
            name: 'A D B',
            account_contacts: [
                {
                    email: 'email@gmail.com',
                    cellphone: '9993516898',
                    first_name: 'ffirst name',
                    last_name: 'second name',
                },
            ],
            account_type_id: clientAccountType.id,
        });

        const updatedAccount = await accountsService.upsertAccount({
            id: createdAccount.id,
            name: 'New name',
            abbreviation: 'New abbr',
            account_contacts: [],
            account_type_id: clientAccountType.id,
        });
        expect(updatedAccount.name).toBe('New name');
        expect(updatedAccount.abbreviation).toBe('New abbr');

        const accountContacts = await accountsService.getAccountContacts({
            account_id: updatedAccount.id,
        });

        expect(accountContacts.length).toBe(0);
    });
});

describe('gets account', () => {
    it('returns account', async () => {
        const createdAccount = await accountsService.upsertAccount({
            name: 'Name',
            abbreviation: 'Abbr',
            account_contacts: [],
            account_type_id: clientAccountType.id,
        });

        const account = await accountsService.getAccount({
            account_id: createdAccount.id,
        });

        expect(account?.abbreviation).toBe('Abbr');
        expect(account?.name).toBe('Name');
    });
});

describe('deletes account', () => {
    it('deletes account and its account contacts', async () => {
        const createdAccount = await accountsService.upsertAccount({
            abbreviation: 'Abbr',
            name: 'Name',
            account_contacts: [
                {
                    email: 'email@email.com',
                    last_name: 'last_nae',
                    first_name: 'first name',
                    cellphone: '9999884433',
                },
            ],
            account_type_id: clientAccountType.id,
        });

        await accountsService.deletesAccount({
            account_id: createdAccount.id,
        });

        const accountContacts = await accountsService.getAccountContacts({
            account_id: createdAccount.id,
        });

        const account = await accountsService.getAccount({
            account_id: createdAccount.id,
        });

        expect(account).toBeFalsy();
        expect(accountContacts.length).toBe(0);
    });

    it('forbids to delete account when there is are related order requests', async () => {
        expect.hasAssertions();

        const product = await createProductForTesting({ app });
        const { account } = await createOrderRequestWithOneProduct({
            app,
            orderRequestCode: currentOrderRequestCode,
            orderRequestProduct: {
                product_id: product.id,
                groups: 1,
                group_weight: product.current_group_weight,
                kilo_price: product.current_kilo_price,
                kilos: product.current_group_weight,
            },
        });

        try {
            await accountsService.deletesAccount({
                account_id: account.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual([
                expect.stringMatching(/order requests count/i),
            ]);
        }
    });
});
