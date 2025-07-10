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
import { TransferType } from '../../../common/dto/entities/management/transfer-type.dto';
import { round } from '../../../common/helpers/number/round';

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

    async getTransfers({
        datePaginator,
    }: {
        datePaginator: YearMonth;
    }): Promise<Transfer[]> {
        if (!datePaginator.year) {
            return [];
        }

        const { startDate, endDate } = getRangesFromYearMonth({
            year: datePaginator.year,
            month: datePaginator.month,
        });

        const transfersWhere: Prisma.transfersWhereInput[] = [
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
                from_account_id: {
                    not: null,
                },
            },
            {
                to_account_id: {
                    not: null,
                },
            },
        ];

        return this.prisma.transfers.findMany({
            where: {
                active: 1,
                AND: transfersWhere,
            },
            orderBy: {
                transferred_date: 'asc',
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

        const andTransfersWhere: Prisma.transfersWhereInput[] = [
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
                to_account_id: transfersQueryArgs.to_account_id || undefined,
            },
            {
                from_account_id:
                    transfersQueryArgs.from_account_id || undefined,
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
                                                  ? [Number(filter)]
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
                                                  in: [filter],
                                              },
                                          },
                                      }
                                    : undefined,
                        },
                    },
                ],
            },
        ];

        const transfersWhere: Prisma.transfersWhereInput = {
            AND: andTransfersWhere,
        };

        const orderBy: Prisma.transfersOrderByWithRelationInput[] = [
            {
                updated_at: 'desc',
            },
        ];

        if (sort_order && sort_field) {
            if (sort_field === 'transferred_date') {
                orderBy.unshift({
                    transferred_date: sort_order,
                });
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

        const total = transfer_receipts.reduce((acc, curr) => {
            return acc + curr.amount;
        }, 0);

        return Math.round(total * 100) / 100;
    }

    async getTransferType({
        transfer_type_id,
    }: {
        transfer_type_id: number | null;
    }): Promise<TransferType | null> {
        if (!transfer_type_id) {
            return null;
        }

        return this.prisma.transfer_type.findFirst({
            where: {
                active: 1,
                id: transfer_type_id,
            },
        });
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
                transfer_type_id: transferInput.transfer_type_id,
            },
            update: {
                ...getUpdatedAtProperty(),
                amount: transferInput.amount,
                from_account_id: transferInput.from_account_id,
                to_account_id: transferInput.to_account_id,
                expected_date: transferInput.expected_date,
                transferred_date: transferInput.transferred_date,
                transferred: transferInput.transferred,
                transfer_type_id: transferInput.transfer_type_id,
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
                      active: 1,
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
                if (delItem.expense_id) {
                    await this.updateExpensesTransfersTotal({
                        expense_id: delItem.expense_id,
                    });
                }

                if (delItem.order_sale_id) {
                    await this.updateOrderSalesTransfersTotal({
                        order_sale_id: delItem.order_sale_id,
                    });
                }
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

            if (createItem.expense_id) {
                await this.updateExpensesTransfersTotal({
                    expense_id: createItem.expense_id,
                });
            }

            if (createItem.order_sale_id) {
                await this.updateOrderSalesTransfersTotal({
                    order_sale_id: createItem.order_sale_id,
                });
            }
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
            if (updateItem.expense_id) {
                await this.updateExpensesTransfersTotal({
                    expense_id: updateItem.expense_id,
                });
            }

            if (updateItem.order_sale_id) {
                await this.updateOrderSalesTransfersTotal({
                    order_sale_id: updateItem.order_sale_id,
                });
            }
        }

        return transfer;
    }

    async updateExpensesTransfersTotal({ expense_id }: { expense_id: number }) {
        const {
            _sum: { amount: transfersTotal },
        } = await this.prisma.transfer_receipts.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                active: 1,
                expense_id: expense_id,
            },
        });

        const {
            _sum: { amount: transfersTotalNoAdjustments },
        } = await this.prisma.transfer_receipts.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                active: 1,
                expense_id: expense_id,
                NOT: {
                    transfers: {
                        transfer_type_id: 4,
                    },
                },
            },
        });

        await this.prisma.expenses.updateMany({
            data: {
                ...getUpdatedAtProperty(),
                transfer_receipts_total: round(transfersTotal || 0),
                transfer_receipts_total_no_adjustments: round(
                    transfersTotalNoAdjustments || 0,
                ),
            },
            where: {
                id: expense_id,
            },
        });
    }

    async updateOrderSalesTransfersTotal({
        order_sale_id,
    }: {
        order_sale_id: number;
    }) {
        const {
            _sum: { amount },
        } = await this.prisma.transfer_receipts.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                active: 1,
                order_sale_id: order_sale_id,
            },
        });

        const {
            _sum: { amount: transfersTotalNoAdjustments },
        } = await this.prisma.transfer_receipts.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                active: 1,
                order_sale_id: order_sale_id,
                NOT: {
                    transfers: {
                        transfer_type_id: 4,
                    },
                },
            },
        });

        await this.prisma.order_sales.updateMany({
            data: {
                ...getUpdatedAtProperty(),
                transfer_receipts_total: round(amount || 0),
                transfer_receipts_total_no_adjustments: round(
                    transfersTotalNoAdjustments || 0,
                ),
            },
            where: {
                id: order_sale_id,
            },
        });
    }

    async validateUpsertTransfer(input: TransferUpsertInput): Promise<void> {
        const errors: string[] = [];

        const isTransferBetweenOwnAccounts = input.transfer_type_id === 1;
        const isTransferClientPayment = input.transfer_type_id === 2;
        const isTransferSupplierPayment = input.transfer_type_id === 3;
        const isTransferAnAdjustment = input.transfer_type_id === 4;

        // Cant change transfer type
        {
            if (input.id) {
                const previousTransfer = await this.getTransfer({
                    transfer_id: input.id,
                });
                if (!!previousTransfer) {
                    if (
                        previousTransfer.transfer_type_id !==
                        input.transfer_type_id
                    ) {
                        errors.push(`Cant change transfer type`);
                    }
                }
            }
        }

        // transfer amount is different than receipt amount
        {
            const hasReceipts = input.transfer_receipts.length > 0;
            const receiptsAmountTotal =
                Math.round(
                    input.transfer_receipts.reduce((acc, curr) => {
                        return acc + curr.amount;
                    }, 0) * 100,
                ) / 100;
            if (
                (isTransferSupplierPayment || isTransferClientPayment) &&
                hasReceipts &&
                input.amount != receiptsAmountTotal
            ) {
                errors.push(
                    `transfer amount (${formatFloat(
                        input.amount,
                    )}) is different than receipts amount (${formatFloat(
                        receiptsAmountTotal,
                    )})`,
                );
            }

            if (isTransferBetweenOwnAccounts) {
                input.transfer_receipts = [];
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

        // either one has to be different than null
        {
            if (
                input.to_account_id === null &&
                input.from_account_id === null
            ) {
                errors.push(
                    `either one of to or from account has to be different than null`,
                );
            }
        }

        // transfer adjustment
        {
            if (isTransferAnAdjustment) {
                if (
                    input.from_account_id !== null &&
                    input.to_account_id !== null
                ) {
                    errors.push(`one account has to be deselected`);
                }
            }
        }

        // transfer between accounts
        {
            if (isTransferBetweenOwnAccounts) {
                if (!input.from_account_id) {
                    errors.push(`from account has to be selected`);
                }

                if (!input.to_account_id) {
                    errors.push(`to account has to be selected`);
                }

                const fromAccount = await this.prisma.accounts.findFirst({
                    where: {
                        id: input.from_account_id || 0,
                    },
                });
                const toAccount = await this.prisma.accounts.findFirst({
                    where: {
                        id: input.to_account_id || 0,
                    },
                });

                if (fromAccount && toAccount) {
                    if (!fromAccount.is_own) {
                        errors.push(`from account has to be owned`);
                    }

                    if (!toAccount.is_own) {
                        errors.push(`to account has to be owned`);
                    }
                }
            }
        }

        // if payment account is provider, then expense id != null and transfer receipts length > 0 has to be
        // if withdrawl account is client, then order sale id != null and transfer receipts length > 0 has to be
        {
            if (isTransferClientPayment || isTransferSupplierPayment) {
                if (!input.from_account_id) {
                    errors.push(`from account has to be selected`);
                }

                if (!input.to_account_id) {
                    errors.push(`to account has to be selected`);
                }

                const fromAccount = await this.prisma.accounts.findFirst({
                    where: {
                        id: input.from_account_id || 0,
                    },
                });
                const toAccount = await this.prisma.accounts.findFirst({
                    where: {
                        id: input.to_account_id || 0,
                    },
                });

                if (fromAccount && toAccount && isTransferClientPayment) {
                    if (!fromAccount.is_client) {
                        errors.push(`from account has to be client`);
                    }
                    if (!toAccount.is_own) {
                        errors.push(`to account has to be an owned account`);
                    }

                    if (fromAccount.is_client && toAccount.is_own) {
                        const receipts = input.transfer_receipts;
                        if (receipts.length === 0) {
                            errors.push(`transfer requires to select a sale`);
                        }
                        for await (const [
                            index,
                            receipt,
                        ] of receipts.entries()) {
                            if (receipt.order_sale_id === null) {
                                errors.push(
                                    `transfer item[${index}] order sale id has to be defined`,
                                );
                            }
                            if (receipt.order_sale_id !== null) {
                                const orderSale =
                                    await this.prisma.order_sales.findFirst({
                                        where: {
                                            id: receipt.order_sale_id,
                                        },
                                    });

                                if (orderSale) {
                                    const orderSaleAccount =
                                        orderSale?.account_id || null;

                                    if (
                                        orderSaleAccount !==
                                        input.from_account_id
                                    ) {
                                        errors.push(
                                            `order sale account is different than from account `,
                                        );
                                    }
                                }
                            }
                        }
                    }
                }

                if (fromAccount && toAccount && isTransferSupplierPayment) {
                    if (!fromAccount.is_own) {
                        errors.push(`from account has to be an owned`);
                    }
                    if (!toAccount.is_supplier) {
                        errors.push(`to account has to be a supplier account`);
                    }

                    if (fromAccount.is_own && toAccount.is_supplier) {
                        const receipts = input.transfer_receipts;
                        if (receipts.length === 0) {
                            errors.push(
                                `payment requires to select an expense`,
                            );
                        }
                        for await (const [
                            index,
                            receipt,
                        ] of receipts.entries()) {
                            if (receipt.expense_id === null) {
                                errors.push(
                                    `payment item[${index}] expense id has to be defined`,
                                );
                            }
                            if (receipt.expense_id !== null) {
                                const expense =
                                    await this.prisma.expenses.findFirst({
                                        where: {
                                            id: receipt.expense_id,
                                        },
                                    });

                                if (expense) {
                                    const expenseAccount =
                                        expense?.account_id || null;

                                    if (
                                        expenseAccount !== input.to_account_id
                                    ) {
                                        errors.push(
                                            `expense account is different than to account `,
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
            }
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
        const transferReceipts = await this.getTransferReceipts({
            transfer_id: transfer_id,
        });

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

        for await (const transferReceipt of transferReceipts) {
            if (transferReceipt.expense_id) {
                await this.updateExpensesTransfersTotal({
                    expense_id: transferReceipt.expense_id,
                });
            }
            if (transferReceipt.order_sale_id) {
                await this.updateOrderSalesTransfersTotal({
                    order_sale_id: transferReceipt.order_sale_id,
                });
            }
        }

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
