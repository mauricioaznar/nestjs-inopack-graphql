import {
    ArgsType,
    Field,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { AccountContactInput } from './account-contact.dto';
import { OffsetPaginatorResult } from '../../pagination/offset-paginator-result/offset-paginator-result';
import { ColumnOrder } from '../../pagination';
import { ProductBase } from '../production/product.dto';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class AccountBase {
    @Field()
    name: string;

    @Field()
    abbreviation: string;

    @Field(() => Boolean, { nullable: false })
    is_supplier: boolean;

    @Field(() => Boolean, { nullable: false })
    is_client: boolean;

    @Field(() => Boolean, { nullable: false })
    is_own: boolean;
}

@InputType('AccountUpsertInput')
export class AccountUpsertInput extends AccountBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;

    @Field(() => [AccountContactInput])
    account_contacts: AccountContactInput[];
}

@ObjectType('Account')
export class Account extends AccountBase {
    @Field({ nullable: false })
    id: number;
}

@ObjectType()
export class PaginatedAccounts extends OffsetPaginatorResult(Account) {}

@ArgsType()
export class PaginatedAccountsQueryArgs {
    @Field(() => String, { nullable: false })
    filter: string;
}

export enum AccountsSortableFields {
    name = 'name',
    abbreviation = 'abbreviation',
}

registerEnumType(AccountsSortableFields, {
    name: 'AccountsSortableFields',
});

@ArgsType()
export class PaginatedAccountsSortArgs {
    @Field(() => ColumnOrder, { nullable: true })
    sort_order: ColumnOrder | null;

    @Field(() => AccountsSortableFields, { nullable: true })
    sort_field: AccountsSortableFields | null;
}

@ArgsType()
export class AccountsQueryArgs {
    @Field(() => Boolean, { nullable: true })
    is_client: boolean | null;

    @Field(() => Boolean, { nullable: true })
    is_own: boolean | null;

    @Field(() => Boolean, { nullable: true })
    is_supplier: boolean | null;
}
