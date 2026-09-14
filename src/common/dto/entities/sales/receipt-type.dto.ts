import { Field, Float, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderSaleReceiptTypeBase {
    @Field()
    name: string;
}

@ObjectType('ReceiptType')
export class ReceiptType extends OrderSaleReceiptTypeBase {
    @Field({ nullable: false })
    id: number;

    // True on the "Nota" receipt type (id 1) — the informal side of the money.
    // Fiscal types ("Factura con IVA") are formal (false). Drives the transfer
    // rule (paired with accounts.is_informal_account) and, by derivation, the
    // accountability-export split (the formal set is `!is_informal_receipt`).
    @Field(() => Boolean, { nullable: false })
    is_informal_receipt: boolean;

    @Field(() => Float, { nullable: false })
    tax_rate: number;
}
