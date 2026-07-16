import { Module } from '@nestjs/common';
import { AccountResourcesResolver } from './account-resources.resolver';
import { AccountResourcesService } from './account-resources.service';

@Module({
    providers: [AccountResourcesResolver, AccountResourcesService],
    exports: [AccountResourcesResolver],
})
export class AccountResourcesModule {}
