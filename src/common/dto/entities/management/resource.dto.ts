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
export class ResourceBase {
    @Field()
    name: string;

    @Field(() => Int, { nullable: true })
    resource_category_id: number | null;

    @Field(() => Boolean, { nullable: false })
    include_units_in_summary: boolean;

    @Field(() => Float, { nullable: true })
    current_group_weight: number | null;

    @Field(() => Float, { nullable: true })
    current_unit_price: number | null;

    @Field(() => Float, { nullable: true })
    current_group_price: number | null;

    @Field(() => Float, { nullable: true })
    group_weight_strict: number | null;
}

@InputType('ResourceUpsertInput')
export class ResourceUpsertInput extends ResourceBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('Resource')
export class Resource extends ResourceBase {
    @Field({ nullable: false })
    id: number;
}

@ObjectType()
export class PaginatedResources extends OffsetPaginatorResult(Resource) {}

@ArgsType()
export class ResourcesQueryArgs {
    @Field(() => String, { nullable: true })
    filter: string;
}

export enum ResourcesSortableFields {
    name = 'name',
}

registerEnumType(ResourcesSortableFields, {
    name: 'ResourcesSortableFields',
});

@ArgsType()
export class ResourcesSortArgs {
    @Field(() => ColumnOrder, { nullable: true })
    sort_order: ColumnOrder | null;

    @Field(() => ResourcesSortableFields, { nullable: true })
    sort_field: ResourcesSortableFields | null;
}

@ArgsType()
export class ResourcesGetQueryArgs {
    @Field(() => [Int], { nullable: true })
    resource_category_id: number[] | null;
}
