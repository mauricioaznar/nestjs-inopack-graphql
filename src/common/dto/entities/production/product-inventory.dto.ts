import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('ProductInventory')
export class ProductInventory {
    @Field({ nullable: true })
    kilos: number | null;

    @Field({ nullable: true })
    groups: number | null;

    @Field({ nullable: true })
    last_update: string;
}
