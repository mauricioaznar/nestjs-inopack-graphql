import { Injectable } from '@nestjs/common';
import {
    TransferReceipt,
    Expense,
    OrderSale,
} from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class TransferReceiptsService {
    constructor(private prisma: PrismaService) {}

    async getTransferReceipts(): Promise<TransferReceipt[]> {
        return this.prisma.transfer_receipts.findMany();
    }

    async getOrderSale({
        order_sale_id,
    }: {
        order_sale_id?: number | null;
    }): Promise<OrderSale | null> {
        if (!order_sale_id) {
            return null;
        }

        return this.prisma.order_sales.findFirst({
            where: {
                id: order_sale_id,
            },
        });
    }

    async getExpense({
        expense_id,
    }: {
        expense_id?: number | null;
    }): Promise<Expense | null> {
        if (!expense_id) {
            return null;
        }

        return this.prisma.expenses.findFirst({
            where: {
                id: expense_id,
            },
        });
    }
}
