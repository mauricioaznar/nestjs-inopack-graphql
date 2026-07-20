import { Module } from '@nestjs/common';
import { ProductsResolver } from './products.resolver';
import { ProductsService } from './products.service';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

@Module({
    providers: [ProductsResolver, ProductsService, AuditUsersService],
    exports: [ProductsResolver],
})
export class ProductsModule {}
