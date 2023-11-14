import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ExpenseRawMaterialAdditionsService } from './expense-raw-material-additions.service';
import {
    ExpenseRawMaterialAddition,
    RawMaterialAddition,
} from '../../../common/dto/entities';
import { Public } from '../../auth/decorators/public.decorator';

@Resolver(() => ExpenseRawMaterialAddition)
// @Role('super')
@Public()
@Injectable()
export class ExpenseRawMaterialAdditionsResolver {
    constructor(private service: ExpenseRawMaterialAdditionsService) {}

    @Query(() => [ExpenseRawMaterialAddition])
    async getExpenseRawMaterialAdditions(): Promise<
        ExpenseRawMaterialAddition[]
    > {
        return this.service.getExpenseRawMaterialAdditions();
    }

    @ResolveField(() => RawMaterialAddition, { nullable: true })
    async raw_material_addition(
        expenseRawMaterialAddition: ExpenseRawMaterialAddition,
    ): Promise<RawMaterialAddition | null> {
        return this.service.getRawMaterialAddition({
            raw_material_addition_id:
                expenseRawMaterialAddition.raw_material_addition_id,
        });
    }
}
