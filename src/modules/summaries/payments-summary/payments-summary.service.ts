import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import {
    PaymentsSummary,
    PaymentsSummaryArgs,
} from '../../../common/dto/entities/summaries/payments-summary.dto';

@Injectable()
export class PaymentsSummaryService {
    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    async getPaymentsSummary({
        entity_groups,
    }: PaymentsSummaryArgs): Promise<PaymentsSummary> {
        let groupByEntityGroup = '';
        let selectEntityGroup = '';
        for (let i = 0; i < entity_groups.length; i++) {
            const entity_group = entity_groups[i];
            switch (entity_group) {
                case 'receipt':
                    selectEntityGroup += 'receipt_type_id, receipt_type_name';
                    groupByEntityGroup += 'receipt_type_id, receipt_type_name';
                    break;
                default:
                    break;
            }

            if (i !== entity_groups.length - 1) {
                selectEntityGroup += ', ';
                groupByEntityGroup += ', ';
            }
        }

        const payments = await this.prisma.$queryRawUnsafe<
            PaymentsSummary['payments']
        >(`
            select sum(ctc.total)                       as               total,
                   ${selectEntityGroup}
            from (
             select 
                 order_sale_payments.amount as total,
                 order_sale_receipt_type.id receipt_type_id,
                 order_sale_receipt_type.name receipt_type_name
            from order_sales
                join order_sale_payments
                on order_sale_payments.order_sale_id = order_sales.id
                left join order_sale_receipt_type
                on order_sale_receipt_type.id = order_sales.order_sale_receipt_type_id
            where order_sale_payments.active = 1
              and order_sales.active = 1
              and order_sale_payments.order_sale_collection_status_id = 1
                ) as ctc
            group by ${groupByEntityGroup}
        `);

        return {
            payments: payments,
        };
    }
}
