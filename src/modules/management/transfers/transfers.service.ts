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
    Account,
    TransferReceipt,
} from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import {
    formatFloat,
    getCreatedAtProperty,
    getRangesFromYearMonth,
    getUpdatedAtProperty,
    vennDiagram,
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

    async getTransferReceipts({
        transfer_id,
    }: {
        transfer_id: number | null;
    }): Promise<TransferReceipt[]> {
        if (!transfer_id) {
            return [];
        }

        return this.prisma.transfer_receipts.findMany({
            where: {
                active: 1,
                transfer_id: transfer_id,
            },
        });
    }

    async getTransferReceiptsTotal({
        transfer_id,
    }: {
        transfer_id: number | null;
    }): Promise<number> {
        if (!transfer_id) {
            return 0;
        }

        const transfer_receipts = await this.prisma.transfer_receipts.findMany({
            where: {
                active: 1,
                transfer_id: transfer_id,
            },
        });

        return transfer_receipts.reduce((acc, curr) => {
            return acc + curr.amount;
        }, 0);
    }

    async getAccount({
        account_id,
    }: {
        account_id: number | null;
    }): Promise<Account | null> {
        if (!account_id) {
            return null;
        }

        return this.prisma.accounts.findFirst({
            where: {
                active: 1,
                id: account_id,
            },
        });
    }

    async upsertTransfer(
        transferInput: TransferUpsertInput,
    ): Promise<Transfer> {
        await this.validateUpsertTransfer(transferInput);

        const transfer = await this.prisma.transfers.upsert({
            create: {
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                amount: transferInput.amount,
                from_account_id: transferInput.from_account_id,
                to_account_id: transferInput.to_account_id,
                expected_date: transferInput.expected_date,
                transferred_date: transferInput.transferred_date,
                transferred: transferInput.transferred,
            },
            update: {
                ...getUpdatedAtProperty(),
                amount: transferInput.amount,
                from_account_id: transferInput.from_account_id,
                to_account_id: transferInput.to_account_id,
                expected_date: transferInput.expected_date,
                transferred_date: transferInput.transferred_date,
                transferred: transferInput.transferred,
            },
            where: {
                id: transferInput.id || 0,
            },
        });

        const newTransferReceipts = transferInput.transfer_receipts;
        const oldTransferReceipts = transferInput.id
            ? await this.prisma.transfer_receipts.findMany({
                  where: {
                      transfer_id: transferInput.id,
                  },
              })
            : [];

        const {
            aMinusB: deleteTransferReceipts,
            bMinusA: createTransferReceipts,
            intersection: updateTransferReceipts,
        } = vennDiagram({
            a: oldTransferReceipts,
            b: newTransferReceipts,
            indexProperties: ['id'],
        });

        for await (const delItem of deleteTransferReceipts) {
            if (delItem && delItem.id) {
                await this.prisma.transfer_receipts.updateMany({
                    data: {
                        ...getUpdatedAtProperty(),
                        active: -1,
                    },
                    where: {
                        id: delItem.id,
                    },
                });
                // await this.cacheManager.del(`product_inventory`);
            }
        }

        for await (const createItem of createTransferReceipts) {
            await this.prisma.transfer_receipts.create({
                data: {
                    ...getCreatedAtProperty(),
                    ...getUpdatedAtProperty(),
                    transfer_id: transfer.id,
                    order_sale_id: createItem.order_sale_id,
                    expense_id: createItem.expense_id,
                    amount: createItem.amount,
                },
            });
            // await this.cacheManager.del(`product_inventory`);
        }

        for await (const updateItem of updateTransferReceipts) {
            if (updateItem && updateItem.id) {
                await this.prisma.transfer_receipts.updateMany({
                    data: {
                        ...getUpdatedAtProperty(),
                        transfer_id: transfer.id,
                        order_sale_id: updateItem.order_sale_id,
                        expense_id: updateItem.expense_id,
                        amount: updateItem.amount,
                    },
                    where: {
                        id: updateItem.id,
                    },
                });
            }
        }

        return transfer;
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
                {
                    transferred_date: {
                        gte: startDate || undefined,
                    },
                },
                {
                    transferred_date: {
                        lt: datePaginator.year ? endDate : undefined,
                    },
                },
                {
                    OR: [
                        {
                            transfer_receipts: {
                                some: isFilterANumber
                                    ? {
                                          order_sales: {
                                              invoice_code: {
                                                  in: isFilterANumber
                                                      ? Number(filter)
                                                      : undefined,
                                              },
                                          },
                                      }
                                    : undefined,
                            },
                        },
                        {
                            transfer_receipts: {
                                some:
                                    filter && filter !== ''
                                        ? {
                                              expenses: {
                                                  order_code: {
                                                      in: filter,
                                                  },
                                              },
                                          }
                                        : undefined,
                            },
                        },
                        {
                            to_account_id:
                                transfersQueryArgs.to_account_id || undefined,
                        },
                        {
                            from_account_id:
                                transfersQueryArgs.from_account_id || undefined,
                        },
                    ],
                },
            ],
        };

        const orderBy: Prisma.transfersOrderByWithRelationInput[] = [
            {
                updated_at: 'desc',
            },
            {
                transferred_date: 'desc',
            },
        ];

        if (sort_order && sort_field) {
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

    async validateUpsertTransfer(input: TransferUpsertInput): Promise<void> {
        const errors: string[] = [];

        // transfer amount is different than receipt amount
        {
            const hasReceipts = input.transfer_receipts.length > 0;
            const receiptsAmountTotal = input.transfer_receipts.reduce(
                (acc, curr) => {
                    return acc + curr.amount;
                },
                0,
            );
            if (hasReceipts && input.amount != receiptsAmountTotal) {
                errors.push(
                    `transfer amount (${formatFloat(
                        input.amount,
                    )}) is different than receipts amount (${formatFloat(
                        receiptsAmountTotal,
                    )})`,
                );
            }
        }

        // order sale is not unique
        {
            const receipts = input.transfer_receipts;
            receipts.forEach(({ order_sale_id: order_sale_id_1 }) => {
                let count = 0;
                receipts.forEach(({ order_sale_id: order_sale_id_2 }) => {
                    if (
                        order_sale_id_1 !== null &&
                        order_sale_id_2 !== null &&
                        order_sale_id_1 === order_sale_id_2
                    ) {
                        count = count + 1;
                    }
                });
                if (count >= 2) {
                    errors.push(
                        `order sale is not unique (order_sale_id: ${order_sale_id_1}`,
                    );
                }
            });
        }

        // expense is not unique
        {
            const receipts = input.transfer_receipts;
            receipts.forEach(({ expense_id: expense_id_1 }) => {
                let count = 0;
                receipts.forEach(({ expense_id: expense_id_2 }) => {
                    if (
                        expense_id_1 !== null &&
                        expense_id_2 !== null &&
                        expense_id_1 === expense_id_2
                    ) {
                        count = count + 1;
                    }
                });
                if (count >= 2) {
                    errors.push(
                        `expense is not unique (expense_id: ${expense_id_1}`,
                    );
                }
            });
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

        if (!transfer) {
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

        await this.prisma.transfer_receipts.updateMany({
            data: {
                active: -1,
            },
            where: {
                transfer_id: transfer_id,
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
