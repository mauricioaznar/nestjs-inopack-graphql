import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    TransfersQueryArgs,
    TransfersSortArgs,
    PaginatedTransfers,
    Transfer,
    TransferUpsertInput,
} from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import {
    getCreatedAtProperty,
    getRangesFromYearMonth,
    getUpdatedAtProperty,
} from '../../../common/helpers';
import { Prisma } from '@prisma/client';

@Injectable()
export class TransfersService {
    constructor(private prisma: PrismaService) {}

    async getTransfer({
        transfer_id,
    }: {
        transfer_id: number;
    }): Promise<Transfer | null> {
        return this.prisma.transfers.findFirst({
            where: {
                id: transfer_id,
                active: 1,
            },
        });
    }

    async getTransfers(): Promise<Transfer[]> {
        return this.prisma.transfers.findMany({
            where: {
                active: 1,
            },
        });
    }

    async upsertTransfer(
        transferInput: TransferUpsertInput,
    ): Promise<Transfer> {
        await this.validateUpsertTransfer(transferInput);

        return this.prisma.transfers.upsert({
            create: {
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                amount: transferInput.amount,
                from_account_id: transferInput.from_account_id,
                to_account_id: transferInput.to_account_id,
                expected_date: transferInput.expected_date,
                completed_date: transferInput.completed_date,
                locked: transferInput.locked,
                order_sale_id: transferInput.order_sale_id,
            },
            update: {
                ...getUpdatedAtProperty(),
                amount: transferInput.amount,
                from_account_id: transferInput.from_account_id,
                to_account_id: transferInput.to_account_id,
                expected_date: transferInput.expected_date,
                completed_date: transferInput.completed_date,
                locked: transferInput.locked,
                order_sale_id: transferInput.order_sale_id,
            },
            where: {
                id: transferInput.id || 0,
            },
        });
    }

    async paginatedTransfers({
        offsetPaginatorArgs,
        datePaginator,
        transfersQueryArgs,
        transfersSortArgs,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        datePaginator: YearMonth;
        transfersQueryArgs: TransfersQueryArgs;
        transfersSortArgs: TransfersSortArgs;
    }): Promise<PaginatedTransfers> {
        const { startDate, endDate } = getRangesFromYearMonth({
            year: datePaginator.year,
            month: datePaginator.month,
        });

        const { sort_order, sort_field } = transfersSortArgs;

        const filter =
            transfersQueryArgs.filter !== '' && !!transfersQueryArgs.filter
                ? transfersQueryArgs.filter
                : undefined;

        const isFilterANumber = !Number.isNaN(Number(filter));

        const transfersWhere: Prisma.transfersWhereInput = {
            AND: [
                {
                    active: 1,
                },
            ],
        };
        let orderBy: Prisma.transfersOrderByWithRelationInput = {
            updated_at: 'desc',
        };

        if (sort_order && sort_field) {
            if (sort_field === 'amount') {
                orderBy = {
                    amount: sort_order,
                };
            }
        }

        const transfersCount = await this.prisma.transfers.count({
            where: transfersWhere,
        });

        const transfers = await this.prisma.transfers.findMany({
            where: transfersWhere,
            take: offsetPaginatorArgs.take,
            skip: offsetPaginatorArgs.skip,
            orderBy: orderBy,
        });

        return {
            count: transfersCount,
            docs: transfers,
        };
    }

    async validateUpsertTransfer(
        transferUpsertInput: TransferUpsertInput,
    ): Promise<void> {
        const errors: string[] = [];

        // order production type cant change

        if (transferUpsertInput.id) {
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }

    async deleteTransfer({
        transfer_id,
    }: {
        transfer_id: number;
    }): Promise<boolean> {
        const transfer = await this.getTransfer({ transfer_id: transfer_id });

        if (!transfer_id) {
            throw new NotFoundException();
        }

        await this.prisma.transfers.update({
            data: {
                active: -1,
            },
            where: {
                id: transfer_id,
            },
        });

        return true;
    }

    async isDeletable({
        transfer_id,
    }: {
        transfer_id: number;
    }): Promise<boolean> {
        return true;
    }

    async isEditable({
        transfer_id,
    }: {
        transfer_id: number;
    }): Promise<boolean> {
        return true;
    }
}
