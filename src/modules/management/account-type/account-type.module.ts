import { Module } from '@nestjs/common';
import { AccountTypeResolver } from './account-type.resolver';
import { AccountTypeService } from './account-type.service';

@Module({
    providers: [AccountTypeResolver, AccountTypeService],
    exports: [AccountTypeResolver],
})
export class AccountTypeModule {}
