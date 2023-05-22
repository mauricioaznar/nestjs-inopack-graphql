import {
    ArgsType,
    Field,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { OffsetPaginatorResult } from '../../pagination/offset-paginator-result/offset-paginator-result';
import { ColumnOrder } from '../../pagination';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class PurchaseBase {
    @Field(() => Boolean, { nullable: false })
    locked: boolean;

    @Field(() => Date, { nullable: true })
    date: Date | null;
}

@InputType('PurchaseUpsertInput')
export class PurchaseUpsertInput extends PurchaseBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('Purchase')
export class Purchase extends PurchaseBase {
    @Field({ nullable: false })
    id: number;
}

@ObjectType()
export class PaginatedPurchases extends OffsetPaginatorResult(Purchase) {}

@ArgsType()
export class PurchasesQueryArgs {
    @Field(() => String, { nullable: true })
    filter: string;
}

export enum PurchasesSortableFields {
    date = 'date',
}

registerEnumType(PurchasesSortableFields, {
    name: 'PurchasesSortableFields',
});

@ArgsType()
export class PurchasesSortArgs {
    @Field(() => ColumnOrder, { nullable: true })
    sort_order: ColumnOrder | null;

    @Field(() => PurchasesSortableFields, { nullable: true })
    sort_field: PurchasesSortableFields | null;
}
