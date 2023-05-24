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
export class ResourceBase {
    @Field()
    name: string;
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
