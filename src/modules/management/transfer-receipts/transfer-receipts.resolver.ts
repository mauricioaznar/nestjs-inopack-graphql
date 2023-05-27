import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { TransferReceiptsService } from './transfer-receipts.service';
import {
    TransferReceipt,
    Resource,
    OrderSale,
    Expense,
} from '../../../common/dto/entities';
import { Public } from '../../auth/decorators/public.decorator';

@Resolver(() => TransferReceipt)
// @Role('super')
@Public()
@Injectable()
export class TransferReceiptsResolver {
    constructor(private service: TransferReceiptsService) {}

    @Query(() => [TransferReceipt])
    async getTransferReceipts(): Promise<TransferReceipt[]> {
        return this.service.getTransferReceipts();
    }

    @ResolveField(() => OrderSale, { nullable: true })
    async order_sale(
        transferReceipt: TransferReceipt,
    ): Promise<OrderSale | null> {
        return this.service.getOrderSale({
            order_sale_id: transferReceipt.order_sale_id,
        });
    }

    @ResolveField(() => Expense, { nullable: true })
    async expense(transferReceipt: TransferReceipt): Promise<Expense | null> {
        return this.service.getExpense({
            expense_id: transferReceipt.expense_id,
        });
    }
}
