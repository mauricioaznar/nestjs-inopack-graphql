import { TransfersService } from './transfers.service';
import dayjs from 'dayjs';
import utcPlugin from 'dayjs/plugin/utc';
import timezonePlugin from 'dayjs/plugin/timezone';

dayjs.extend(utcPlugin);
dayjs.extend(timezonePlugin);

function makePrisma() {
    return {
        transfers: {
            count: jest.fn().mockResolvedValue(0),
            findMany: jest.fn().mockResolvedValue([]),
        },
    } as any;
}

describe('TransfersService business-time ranges', () => {
    it('uses Mexico midnight instants for Contabilidad month bounds', async () => {
        const prisma = makePrisma();
        const service = new TransfersService(prisma);

        await service.getTransfers({
            datePaginator: {
                start_date: '2026-07-01',
                end_date: '2026-08-01',
            } as any,
        });

        const where = prisma.transfers.findMany.mock.calls[0][0].where;
        expect(where.AND[1].transferred_date.gte.toISOString()).toBe(
            '2026-07-01T06:00:00.000Z',
        );
        expect(where.AND[2].transferred_date.lt.toISOString()).toBe(
            '2026-08-01T06:00:00.000Z',
        );
    });

    it('treats a picked Transferencias day as a complete Mexico day', async () => {
        const prisma = makePrisma();
        const service = new TransfersService(prisma);

        await service.paginatedTransfers({
            offsetPaginatorArgs: { skip: 0, take: 20 } as any,
            datePaginator: {
                start_date: '2026-07-31',
                end_date: '2026-07-31',
            } as any,
            transfersQueryArgs: { filter: '' } as any,
            transfersSortArgs: {} as any,
        });

        const where = prisma.transfers.count.mock.calls[0][0].where;
        expect(where.AND[1].transferred_date.gte.toISOString()).toBe(
            '2026-07-31T06:00:00.000Z',
        );
        expect(where.AND[2].transferred_date.lt.toISOString()).toBe(
            '2026-08-01T06:00:00.000Z',
        );
    });

    it('keeps omitted date bounds unbounded', async () => {
        const prisma = makePrisma();
        const service = new TransfersService(prisma);

        await service.getTransfers({
            datePaginator: {} as any,
        });

        const where = prisma.transfers.findMany.mock.calls[0][0].where;
        expect(where.AND[1].transferred_date.gte).toBeUndefined();
        expect(where.AND[2].transferred_date.lt).toBeUndefined();
    });
});

// ── informal / formal money pairing ─────────────────────────────────────────
// An own account may only be linked to documents whose receipt-type formality
// matches its own: informal account (is_informal_account) ↔ nota receipt
// (is_informal_receipt), formal account ↔ fiscal receipt. A supplier payment is
// used because its own account is the `from` side, one linked expense, and the
// rest of the payload is kept valid so only the informal rule can fire.

function byId(map: Record<number, any>) {
    return {
        findFirst: jest.fn(async (args: any) => map[args?.where?.id] ?? null),
    };
}

function makeValidationPrisma({
    ownInformal,
    receiptInformal,
}: {
    ownInformal: boolean;
    receiptInformal: boolean | null;
}) {
    return {
        accounts: byId({
            100: {
                id: 100,
                name: 'Own',
                is_own: true,
                is_client: false,
                is_supplier: false,
                is_informal_account: ownInformal,
            },
            200: {
                id: 200,
                name: 'Supplier',
                is_own: false,
                is_client: false,
                is_supplier: true,
            },
        }),
        expenses: byId({
            300: {
                id: 300,
                account_id: 200,
                receipt_types:
                    receiptInformal === null
                        ? null
                        : { is_informal_receipt: receiptInformal },
            },
        }),
        order_sales: byId({}),
        transfers: { findFirst: jest.fn().mockResolvedValue(null) },
    } as any;
}

function supplierPaymentInput() {
    return {
        id: null,
        transfer_type_id: 3,
        from_account_id: 100,
        to_account_id: 200,
        amount: 100,
        transferred: true,
        transferred_date: '2026-09-14 00:00:00',
        expected_date: null,
        notes: '',
        transfer_receipts: [
            { id: null, order_sale_id: null, expense_id: 300, amount: 100 },
        ],
    } as any;
}

async function formalityErrors(prisma: any): Promise<string[] | null> {
    const service = new TransfersService(prisma);
    try {
        await service.validateUpsertTransfer(supplierPaymentInput());
        return null;
    } catch (e: any) {
        const res = e.getResponse ? e.getResponse() : e;
        const messages = res?.message ?? res;
        return Array.isArray(messages) ? messages : [String(messages)];
    }
}

describe('TransfersService informal/formal pairing', () => {
    it('allows a formal own account on a fiscal document', async () => {
        const errors = await formalityErrors(
            makeValidationPrisma({
                ownInformal: false,
                receiptInformal: false,
            }),
        );
        expect(errors).toBeNull();
    });

    it('allows an informal own account on a nota document', async () => {
        const errors = await formalityErrors(
            makeValidationPrisma({ ownInformal: true, receiptInformal: true }),
        );
        expect(errors).toBeNull();
    });

    it('rejects a formal own account on a nota document', async () => {
        const errors = await formalityErrors(
            makeValidationPrisma({ ownInformal: false, receiptInformal: true }),
        );
        expect(errors?.some((m) => m.includes('formality'))).toBe(true);
    });

    it('rejects an informal own account on a fiscal document', async () => {
        const errors = await formalityErrors(
            makeValidationPrisma({ ownInformal: true, receiptInformal: false }),
        );
        expect(errors?.some((m) => m.includes('formality'))).toBe(true);
    });

    it('leaves a document with no receipt type unrestricted', async () => {
        const errors = await formalityErrors(
            makeValidationPrisma({ ownInformal: true, receiptInformal: null }),
        );
        expect(errors).toBeNull();
    });
});
