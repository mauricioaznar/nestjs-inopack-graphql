import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ProductTypeBase {
    @Field()
    name: string;
}

@ObjectType('ProductType')
export class ProductType extends ProductTypeBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    order_production_type_id: number | null;

    @Field(() => Int, { nullable: true })
    product_type_category_id: number | null;
}
