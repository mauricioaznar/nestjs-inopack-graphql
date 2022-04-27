import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ProductBase {
    @Field()
    description: string;

    @Field()
    code: string;

    @Field()
    current_kilo_price: number;

    @Field()
    width: number;

    @Field()
    length: number;

    @Field()
    current_group_weight: number;

    @Field()
    calibre: number;

    @Field({ nullable: true })
    packing_id: number | null;

    @Field({ nullable: true })
    product_type_id: number | null;

    @Field({ nullable: true })
    order_production_type_id: number | null;
}

@InputType('ProductUpsertInput')
export class ProductUpsertInput extends ProductBase {
    @Field({ nullable: true })
    id?: number | null;
}

@ObjectType('Product')
export class Product extends ProductBase {
    @Field({ nullable: false })
    id: number;
}
