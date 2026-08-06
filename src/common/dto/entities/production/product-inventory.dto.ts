import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('ProductInventory')
export class ProductInventory {
    @Field(() => Float, { nullable: true })
    kilos: number | null;

    @Field(() => Float, { nullable: true })
    groups: number | null;

    // Only the net balance is exposed. The breakdown components (produced,
    // consumed, adjusted, sold) live in the query's SELECT for readability but
    // are deliberately NOT on the DTO — nothing renders them, and the consumption
    // leg already reaches the client through its effect on `kilos`/`groups`. Add
    // them back here if a breakdown UI is ever built.

    // Stock physically on hand but already sold on a sale that is not yet
    // Entregado. `kilos`/`groups` deliberately still INCLUDE these: goods leave
    // the warehouse at Entregado, and a pedido's remaining is likewise measured
    // against delivered sales, so the two sides stay paired. Exposed separately
    // so a planning view can show what is genuinely still promisable.
    @Field(() => Float, { nullable: true })
    kilos_committed: number | null;

    @Field(() => Float, { nullable: true })
    groups_committed: number | null;

    @Field(() => String, { nullable: true })
    last_update: string;

    @Field(() => Int, { nullable: true })
    product_id: number | null;
}
