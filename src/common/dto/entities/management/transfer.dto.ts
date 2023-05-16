import {
    ArgsType,
    Field,
    Float,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { OffsetPaginatorResult } from '../../pagination/offset-paginator-result/offset-paginator-result';
import { ColumnOrder } from '../../pagination';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class TransferBase {
    @Field(() => Float, { nullable: false })
    amount: number;

    @Field(() => Int, { nullable: true })
    from_account_id: number | null;

    @Field(() => Int, { nullable: true })
    to_account_id: number | null;

    @Field(() => Date, { nullable: true })
    expected_date: Date | null;

    @Field(() => Boolean, { nullable: false })
    locked: boolean;

    @Field(() => Date, { nullable: true })
    completed_date: Date | null;

    @Field(() => Int, { nullable: true })
    order_sale_id: number | null;
}

@InputType('TransferUpsertInput')
export class TransferUpsertInput extends TransferBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('Transfer')
export class Transfer extends TransferBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Boolean, { nullable: false })
    locked: boolean;

    @Field(() => Date, { nullable: true })
    completed_date: Date | null;

    @Field(() => Int, { nullable: true })
    order_sale_id: number | null;
}

@ObjectType()
export class PaginatedTransfers extends OffsetPaginatorResult(Transfer) {}

@ArgsType()
export class TransfersQueryArgs {
    @Field(() => String, { nullable: true })
    filter: string;

    @Field(() => Int, { nullable: true })
    to_account_id: number | null;

    @Field(() => Int, { nullable: true })
    from_account_id: number | null;
}

export enum TransfersSortableFields {
    amount = 'amount',
}

registerEnumType(TransfersSortableFields, {
    name: 'TransfersSortableFields',
});

@ArgsType()
export class TransfersSortArgs {
    @Field(() => ColumnOrder, { nullable: true })
    sort_order: ColumnOrder | null;

    @Field(() => TransfersSortableFields, { nullable: true })
    sort_field: TransfersSortableFields | null;
}
