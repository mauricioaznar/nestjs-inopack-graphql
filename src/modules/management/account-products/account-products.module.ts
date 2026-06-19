import { Module } from '@nestjs/common';
import { AccountProductsResolver } from './account-products.resolver';
import { AccountProductsService } from './account-products.service';

@Module({
    providers: [AccountProductsResolver, AccountProductsService],
    exports: [AccountProductsResolver],
})
export class AccountProductsModule {}
