import { Module } from '@nestjs/common';
import { SupplierTypesResolver } from './supplier-types.resolver';
import { SupplierTypesService } from './supplier-types.service';

@Module({
    providers: [SupplierTypesResolver, SupplierTypesService],
    exports: [SupplierTypesResolver],
})
export class SupplierTypesModule {}
