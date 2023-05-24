import { getUtcDate, setupApp } from '../../../common/__tests__/helpers';
import { INestApplication } from '@nestjs/common';
import {
    ownAccountType,
    supplierAccountType,
} from '../../../common/__tests__/objects/management/account-types';
import { AccountsService } from '../accounts/accounts.service';
import { ExpensesService } from './expenses.service';
import { orderSaleReceiptType1 } from '../../../common/__tests__/objects/sales/order-sale-receipt-types';
import { orderSaleStatus2 } from '../../../common/__tests__/objects/sales/order-sale-statuses';
import { salesUser } from '../../../common/__tests__/objects/auth/users';

let app: INestApplication;
let accountsService: AccountsService;
let expensesService: ExpensesService;

beforeAll(async () => {
    app = await setupApp();
    accountsService = app.get(AccountsService);
    expensesService = app.get(ExpensesService);
});

afterAll(async () => {
    await app.close();
});

describe('expense upsert', () => {
    it('creates expense', async () => {
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
            account_type_id: supplierAccountType.id,
        });

        const expense = await expensesService.upsertExpense({
            account_id: account.id,
            date: getUtcDate(),
            locked: false,
            expense_resource: [
                {
                    amount: 200,
                },
            ],
        });

        expect(expense.id).toBeDefined();
        expect(expense.locked).toBe(false);

        const expenseItems = await expensesService.getExpenseResources({
            expense_id: expense.id,
        });

        expect(expenseItems.length).toBe(1);
        expect(expenseItems).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    amount: 200,
                }),
            ]),
        );
    });

    it('fails when account is not supplier', async () => {
        expect.hasAssertions();

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
            account_type_id: ownAccountType.id,
        });

        try {
            await expensesService.upsertExpense({
                account_id: account.id,
                date: getUtcDate(),
                locked: false,
                expense_resource: [
                    {
                        amount: 200,
                    },
                ],
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/account is not a supplier/i),
                ]),
            );
        }
    });
});
