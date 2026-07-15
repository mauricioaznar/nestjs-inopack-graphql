import { Field, InputType, ObjectType } from '@nestjs/graphql';

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

    // Read-only flag (seeded by migration on "Factura con IVA", id 2). Replaces
    // the hardcoded receipt_type_id === 2 check that decides which documents go
    // into the accountability Excel export.
    @Field(() => Boolean, { nullable: false })
    include_in_accountability_export: boolean;
}
