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
