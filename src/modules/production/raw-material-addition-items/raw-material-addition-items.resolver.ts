import { Float, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { RawMaterialAdditionItemsService } from './raw-material-addition-items.service';
import { Public } from '../../auth/decorators/public.decorator';
import {
    RawMaterialAddition,
    RawMaterialAdditionItem,
    Resource,
} from '../../../common/dto/entities';

@Resolver(() => RawMaterialAdditionItem)
@Public()
@Injectable()
export class RawMaterialAdditionItemsResolver {
    constructor(private service: RawMaterialAdditionItemsService) {}

    @Query(() => [RawMaterialAdditionItem])
    async getRawMaterialAdditionItems(): Promise<RawMaterialAdditionItem[]> {
        return this.service.getRawMaterialAdditionItems();
    }

    @ResolveField(() => RawMaterialAddition, { nullable: true })
    raw_material_addition(
        rawMaterialAdditionItem: RawMaterialAdditionItem,
    ): Promise<RawMaterialAddition | null> {
        return this.service.getRawMaterialAddition({
            raw_material_addition_id:
                rawMaterialAdditionItem.raw_material_addition_id,
        });
    }

    @ResolveField(() => Resource, { nullable: true })
    async resource(
        rawMaterialAdditionItem: RawMaterialAdditionItem,
    ): Promise<Resource | null> {
        return this.service.getResource({
            resource_id: rawMaterialAdditionItem.resource_id,
        });
    }

    @ResolveField(() => Float, { nullable: false })
    async total(
        @Parent() rawMaterialAdditionItem: RawMaterialAdditionItem,
    ): Promise<number> {
        return this.service.getTotal({
            raw_material_addition_item_id: rawMaterialAdditionItem.id,
        });
    }
}
