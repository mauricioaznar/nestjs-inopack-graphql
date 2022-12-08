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
import { OrderProduction } from './order-production.dto';
import { ColumnOrder } from '../../pagination';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ProductBase {
    @Field()
    internal_description: string;

    @Field()
    external_description: string;

    @Field(() => Boolean)
    discontinued: boolean;

    @Field()
    code: string;

    @Field(() => Float, { nullable: false })
    current_kilo_price: number;

    @Field(() => Float, { nullable: false })
    width: number;

    @Field(() => Float, { nullable: true })
    length: number | null;

    @Field(() => Float, { nullable: false })
    current_group_weight: number;

    @Field()
    calibre: number;

    @Field(() => Int, { nullable: true })
    packing_id: number | null;

    @Field(() => Int, { nullable: true })
    product_type_id: number | null;

    @Field(() => Int, { nullable: true })
    product_category_id: number | null;

    @Field(() => Int, { nullable: true })
    product_material_id: number | null;

    @Field(() => Int, { nullable: true })
    order_production_type_id: number | null;
}

@InputType('ProductUpsertInput')
export class ProductUpsertInput extends ProductBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('Product')
export class Product extends ProductBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Date, { nullable: true })
    updated_at: Date | null;
}

@ObjectType()
export class PaginatedProducts extends OffsetPaginatorResult(Product) {}

@ArgsType()
export class PaginatedProductsQueryArgs {
    @Field(() => String, { nullable: false })
    filter: string;

    @Field(() => Int, { nullable: true })
    product_category_id: number | null;

    @Field(() => Boolean, { nullable: false })
    include_discontinued: boolean;
}

export enum ProductsSortableFields {
    external_description = 'external_description',
    internal_description = 'internal_description',
    order_production_type_id = 'order_production_type_id',
    product_category_id = 'product_category_id',
}

registerEnumType(ProductsSortableFields, {
    name: 'ProductsSortableFields',
});

@ArgsType()
export class PaginatedProductsSortArgs {
    @Field(() => ColumnOrder, { nullable: true })
    sort_order: ColumnOrder | null;

    @Field(() => ProductsSortableFields, { nullable: true })
    sort_field: ProductsSortableFields | null;
}

@ArgsType()
export class GetProductsQueryFields {
    @Field(() => Boolean, { nullable: true })
    exclude_discontinued: boolean | null;
}
