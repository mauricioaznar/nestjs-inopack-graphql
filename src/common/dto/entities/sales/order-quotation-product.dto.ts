import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderQuotationProductBase {
    @Field({ nullable: false })
    groups: number;

    @Field({ nullable: false })
    kilos: number;

    @Field(() => Float, { nullable: false })
    kilo_price: number;

    @Field(() => Float, { nullable: false })
    group_price: number;

    @Field({ nullable: false })
    group_weight: number;

    // NULLABLE on purpose — the one place in the system where a line may name no
    // product. A free line (product_id NULL) carries its specification in
    // proposed_description instead. See the plan, "order_quotation_products".
    @Field(() => Int, { nullable: true })
    product_id?: number | null;

    // Used when product_id is NULL: the free-line specification, printed on the
    // PDF. '' by default. Validation requires it to be non-empty on a free line.
    @Field(() => String, { nullable: false })
    proposed_description: string;
}

@InputType('OrderQuotationProductInput')
export class OrderQuotationProductInput extends OrderQuotationProductBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('OrderQuotationProduct')
export class OrderQuotationProduct extends OrderQuotationProductBase {
    @Field(() => Int, { nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    order_quotation_id?: number | null;
}
