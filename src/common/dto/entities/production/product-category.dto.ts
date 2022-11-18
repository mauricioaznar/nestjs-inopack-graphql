import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ProductCategoryBase {
    @Field()
    name: string;
}

@ObjectType('ProductCategory')
export class ProductCategory extends ProductCategoryBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    order_production_type_id: number | null;
}
