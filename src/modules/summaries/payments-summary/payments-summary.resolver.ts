import { Args, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { PaymentsSummaryService } from './payments-summary.service';
import {
    PaymentsSummary,
    PaymentsSummaryArgs,
} from '../../../common/dto/entities/summaries/payments-summary.dto';

@Resolver(() => PaymentsSummary)
// @Role('super')
@Injectable()
export class PaymentsSummaryResolver {
    constructor(private service: PaymentsSummaryService) {}

    @Query(() => PaymentsSummary, { nullable: false })
    async getPaymentsSummary(
        @Args('PaymentsSummaryArgs')
        paymentsSummaryArgs: PaymentsSummaryArgs,
    ): Promise<PaymentsSummary> {
        return this.service.getPaymentsSummary(paymentsSummaryArgs);
    }
}
