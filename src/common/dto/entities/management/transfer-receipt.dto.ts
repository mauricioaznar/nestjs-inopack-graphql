import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class TransferReceiptBase {
    @Field(() => Int, { nullable: true })
    order_sale_id?: number | null;

    @Field(() => Int, { nullable: true })
    expense_id?: number | null;

    @Field(() => Float, { nullable: false })
    amount: number;
}

@InputType('TransferReceiptInput')
export class TransferReceiptInput extends TransferReceiptBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('TransferReceipt')
export class TransferReceipt extends TransferReceiptBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    transfer_id?: number | null;
}
