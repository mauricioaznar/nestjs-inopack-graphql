import { Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { PackingsService } from './packings.service';
import { Packing } from '../../../common/dto/entities';

@Resolver(() => Packing)
// @Role('super')
@Injectable()
export class PackingsResolver {
    constructor(private packingsService: PackingsService) {}

    @Query(() => [Packing])
    async getPackings(): Promise<Packing[]> {
        return this.packingsService.getPackings();
    }
}
