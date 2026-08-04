import { Float, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ReceiptTypeService } from './receipt-type.service';
import { ReceiptType } from '../../../common/dto/entities';
import { Public } from '../../auth/decorators/public.decorator';

@Resolver(() => ReceiptType)
// @Role('super')
@Public()
@Injectable()
export class ReceiptTypeResolver {
    constructor(private service: ReceiptTypeService) {}

    @Query(() => [ReceiptType])
    async getReceiptTypes(): Promise<ReceiptType[]> {
        return this.service.getReceiptTypes();
    }

    @ResolveField(() => Float)
    tax_rate(@Parent() rt: { tax_rate: unknown }): number {
        return Number(rt.tax_rate);
    }

    @ResolveField(() => Boolean)
    applies_tax(@Parent() rt: { tax_rate: unknown }): boolean {
        return Number(rt.tax_rate) > 0;
    }

    @ResolveField(() => Float)
    tax_multiplier(@Parent() rt: { tax_rate: unknown }): number {
        return 1 + Number(rt.tax_rate);
    }
}
