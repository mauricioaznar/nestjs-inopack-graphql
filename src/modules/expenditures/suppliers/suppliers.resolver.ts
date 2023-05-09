import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { Supplier, SupplierUpsertInput } from '../../../common/dto/entities';

@Resolver(() => Supplier)
@Injectable()
export class SuppliersResolver {
    constructor(private suppliersService: SuppliersService) {}

    @Mutation(() => Supplier)
    async createSupplier(
        @Args('SupplierUpsertInput') input: SupplierUpsertInput,
    ) {
        return this.suppliersService.createSupplier(input);
    }

    @Query(() => [Supplier])
    async getSuppliers() {
        return this.suppliersService.getSuppliers();
    }
}
