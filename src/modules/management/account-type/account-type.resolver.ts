import { Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { AccountTypeService } from './account-type.service';
import { AccountType } from '../../../common/dto/entities';
import { Public } from '../../auth/decorators/public.decorator';

@Resolver(() => AccountType)
// @Role('super')
@Public()
@Injectable()
export class AccountTypeResolver {
    constructor(private service: AccountTypeService) {}

    @Query(() => [AccountType])
    async getAccountTypes(): Promise<AccountType[]> {
        return this.service.getAccountTypes();
    }
}
