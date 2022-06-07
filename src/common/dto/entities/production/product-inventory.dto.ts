import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('ProductInventory')
export class ProductInventory {
    @Field(() => Int, { nullable: true })
    kilos: number | null;

    @Field(() => Int, { nullable: true })
    groups: number | null;

    @Field(() => String, { nullable: true })
    last_update: string;
}
