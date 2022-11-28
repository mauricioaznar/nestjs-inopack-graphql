import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ProductBase {
    @Field()
    description: string;

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
}
