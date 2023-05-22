import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class PurchaseItemBase {
    @Field(() => Float, { nullable: false })
    amount: number;
}

@InputType('PurchaseItemInput')
export class PurchaseItemInput extends PurchaseItemBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('PurchaseItem')
export class PurchaseItem extends PurchaseItemBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    purchase_id?: number | null;
}
