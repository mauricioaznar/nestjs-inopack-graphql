import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderSaleCommentBase {
    @Field(() => String, { nullable: false })
    body: string;

    @Field(() => Boolean, { nullable: false })
    has_pending_task: boolean;

    @Field(() => Boolean, { nullable: false })
    pending_task_complete: boolean;

    @Field(() => String, { nullable: false })
    pending_task_comment: string;
}

@InputType('CreateOrderSaleCommentInput')
export class CreateOrderSaleCommentInput extends OrderSaleCommentBase {
    @Field(() => Int, { nullable: false })
    order_sale_id: number;
}

@InputType('UpdateOrderSaleCommentInput')
export class UpdateOrderSaleCommentInput extends OrderSaleCommentBase {
    @Field(() => Int, { nullable: false })
    order_sale_comment_id: number;
}

@ObjectType('OrderSaleComment')
export class OrderSaleComment extends OrderSaleCommentBase {
    @Field(() => Int, { nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    order_sale_id: number | null;

    @Field(() => Date, { nullable: true })
    created_at: Date | null;

    @Field(() => Date, { nullable: true })
    updated_at: Date | null;

    // Author audit stamp — server-side only, never client-supplied.
    @Field(() => Int, { nullable: true })
    created_by_id: number | null;
}
