import { getUtcDate, setupApp } from '../../../common/__tests__/helpers';
import { INestApplication } from '@nestjs/common';
import { AccountsService } from '../accounts/accounts.service';
import { ExpensesService } from './expenses.service';
import { receiptType1 } from '../../../common/__tests__/objects/sales/receipt-types';

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
            is_supplier: true,
            is_client: false,
            is_own: false,
        });

        const expense = await expensesService.upsertExpense({
            account_id: account.id,
            date: getUtcDate(),
            locked: false,
            notes: '',
            expense_resources: [
                {
                    amount: 200,
                },
            ],
            tax: 0,
            tax_retained: 0,
            non_tax: 0,
            non_tax_retained: 0,
            expected_payment_date: getUtcDate(),
            order_code: '',
            receipt_type_id: receiptType1.id,
            require_supplement: false,
            supplement_code: '',
            canceled: false,
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
            is_supplier: true,
            is_client: false,
            is_own: false,
        });

        try {
            await expensesService.upsertExpense({
                account_id: account.id,
                date: getUtcDate(),
                locked: false,
                notes: '',
                tax: 0,
                expense_resources: [
                    {
                        amount: 200,
                    },
                ],
                order_code: '',
                tax_retained: 0,
                non_tax: 0,
                non_tax_retained: 0,
                expected_payment_date: getUtcDate(),
                receipt_type_id: receiptType1.id,
                require_supplement: false,
                supplement_code: '',
                canceled: false,
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
