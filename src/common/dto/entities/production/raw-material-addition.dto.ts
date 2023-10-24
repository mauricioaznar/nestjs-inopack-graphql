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
export class RawMaterialAdditionBase {
    @Field(() => Date, { nullable: true })
    date: Date | null;
}

@InputType('RawMaterialAdditionUpsertInput')
export class RawMaterialAdditionUpsertInput extends RawMaterialAdditionBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('RawMaterialAddition')
export class RawMaterialAddition extends RawMaterialAdditionBase {
    @Field({ nullable: false })
    id: number;
}

export enum PaginatedRawMaterialAdditionsSortableFields {
    date = 'date',
}

registerEnumType(PaginatedRawMaterialAdditionsSortableFields, {
    name: 'PaginatedRawMaterialAdditionsSortableFields',
});

@ArgsType()
export class PaginatedRawMaterialAdditionsSortArgs {
    @Field(() => ColumnOrder, { nullable: true })
    sort_order: ColumnOrder | null;

    @Field(() => PaginatedRawMaterialAdditionsSortableFields, {
        nullable: true,
    })
    sort_field: PaginatedRawMaterialAdditionsSortableFields | null;
}

@ObjectType()
export class PaginatedRawMaterialAdditions extends OffsetPaginatorResult(
    RawMaterialAddition,
) {}

@ArgsType()
export class PaginatedRawMaterialAdditionsQueryArgs {
    @Field(() => String, { nullable: false })
    filter: string;
}
