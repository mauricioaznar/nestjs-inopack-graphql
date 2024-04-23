import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('ProductInventory')
export class ProductInventory {
    @Field(() => Float, { nullable: true })
    kilos: number | null;

    @Field(() => Float, { nullable: true })
    groups: number | null;

    @Field(() => String, { nullable: true })
    last_update: string;

    @Field(() => Int, { nullable: true })
    product_id: number | null;
}
