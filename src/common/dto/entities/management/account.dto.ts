import {
    ArgsType,
    Field,
    Float,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { AccountContactInput } from './account-contact.dto';
import { AccountProductInput } from './account-product.dto';
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
    requires_order_request: boolean;

    @Field(() => Boolean, { nullable: false })
    monitor_balance: boolean;

    @Field(() => Boolean, { nullable: false })
    is_client: boolean;

    @Field(() => Int, { nullable: true })
    supplier_type_id: number | null;

    @Field(() => Int, { nullable: true })
    resource_id: number | null;

    // Credit terms + default flags. The client_* values pre-fill order sales,
    // the supplier_* values pre-fill expenses, when this account is selected.
    @Field(() => Int, { nullable: false })
    client_credit_days: number;

    @Field(() => Int, { nullable: false })
    supplier_credit_days: number;

    @Field(() => Boolean, { nullable: false })
    client_require_credit_note: boolean;

    @Field(() => Boolean, { nullable: false })
    client_require_supplement: boolean;

    @Field(() => Boolean, { nullable: false })
    supplier_require_external_code: boolean;

    @Field(() => Boolean, { nullable: false })
    supplier_require_supplement: boolean;

    @Field(() => Boolean, { nullable: false })
    client_automatic_tax_calculation: boolean;
}

@InputType('AccountUpsertInput')
export class AccountUpsertInput extends AccountBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;

    @Field(() => [AccountContactInput])
    account_contacts: AccountContactInput[];

    @Field(() => [AccountProductInput])
    account_products: AccountProductInput[];
}

@ObjectType('Account')
export class Account extends AccountBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Boolean, { nullable: false })
    is_own: boolean;
}

@ObjectType()
export class PaginatedAccounts extends OffsetPaginatorResult(Account) {}

@ArgsType()
export class PaginatedAccountsQueryArgs {
    @Field(() => String, { nullable: false })
    filter: string;

    @Field(() => Boolean, { nullable: true })
    is_client: boolean | null;
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

@ObjectType('AccountTransactionItem')
export class AccountTransactionItem {
    @Field(() => Int)
    id: number;

    @Field(() => String)
    type: string;

    @Field(() => String)
    order_code: string;

    @Field(() => Int, { nullable: true })
    invoice_code: number | null;

    @Field(() => Date)
    date: Date;

    @Field(() => String)
    notes: string;

    @Field(() => Int, { nullable: true })
    receipt_type_id: number | null;

    @Field(() => Float)
    total_with_tax: number;

    @Field(() => Float)
    transfer_receipts_total: number;

    @Field(() => String, { nullable: true })
    expense_status_color: string | null;
}

// A single transfer (payment) as its own ledger row, filtered by its own
// transferred_date. Carries enough of its parent sale/expense to render the
// folio and decide whether it's an advance ("Anticipo") in the date-ordered
// account statement.
@ObjectType('AccountTransferItem')
export class AccountTransferItem {
    @Field(() => Float)
    amount: number;

    @Field(() => Date, { nullable: true })
    transferred_date: Date | null;

    @Field(() => String)
    notes: string;

    @Field(() => String)
    parent_type: string;

    @Field(() => String)
    parent_order_code: string;

    @Field(() => Int, { nullable: true })
    parent_invoice_code: number | null;

    @Field(() => Int, { nullable: true })
    parent_receipt_type_id: number | null;

    @Field(() => Date, { nullable: true })
    parent_date: Date | null;
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
