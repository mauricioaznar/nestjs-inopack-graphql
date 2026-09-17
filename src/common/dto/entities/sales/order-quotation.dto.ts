import {
    ArgsType,
    Field,
    Float,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { OrderQuotationProductInput } from './order-quotation-product.dto';
import { OffsetPaginatorResult } from '../../pagination/offset-paginator-result/offset-paginator-result';
import { ColumnOrder } from '../../pagination';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderQuotationBase {
    @Field({ nullable: false })
    date: Date;

    @Field()
    order_code: number;

    @Field(() => Date, { nullable: true })
    estimated_delivery_date: Date | null;

    @Field(() => Int, { nullable: true })
    account_id?: number | null;

    @Field(() => String, { nullable: false })
    notes: string;

    // vigencia — NULL means "sin vencimiento" (never expires). Expiration is
    // NOT a status: "vencida" is derived from expiration_date < today on read.
    @Field(() => Date, { nullable: true })
    expiration_date?: Date | null;

    // condiciones de pago — free text, '' by default.
    @Field(() => String, { nullable: false })
    payment_terms: string;

    // IVA visible on the document. Follows the sales convention: 16% when true,
    // 0% otherwise. Amounts (subtotal/tax/total) are derived, never stored.
    @Field(() => Boolean, { nullable: false })
    require_tax: boolean;
}

@InputType('OrderQuotationInput')
export class OrderQuotationInput extends OrderQuotationBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;

    @Field(() => [OrderQuotationProductInput])
    order_quotation_products: OrderQuotationProductInput[];
}

@ObjectType('OrderQuotation')
export class OrderQuotation extends OrderQuotationBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Date, { nullable: true })
    updated_at?: Date | null;

    // Status is read here but never accepted on OrderQuotationInput: upserts
    // default it to 1 (Borrador) and only the admin-only
    // updateOrderQuotationStatus mutation can change it.
    @Field(() => Int, { nullable: true })
    order_quotation_status_id?: number | null;

    // When this cotización wrote the client's catalog (the acceptance Catálogo
    // step). STORED, never derived — the record that a one-time destructive
    // write happened. NULL = not yet. Drives the catalog step-state and lets the
    // acceptance panel say *when*. See the plan, "One stored column, two derived".
    @Field(() => Date, { nullable: true })
    account_products_updated_at?: Date | null;

    // The AUTHORITATIVE pedido-completion marker (the acceptance Pedido step).
    // STORED, set ONLY after the order-request service returns from creating the
    // pedido and all its lines. NULL = not yet completed. A linked pedido whose
    // row exists but whose completion was never stamped is a DIAGNOSTIC
    // half-state, never "done" — completion is not inferred by comparing the
    // quotation with the pedido. See the plan, "The pedido completion marker".
    @Field(() => Date, { nullable: true })
    order_request_completed_at?: Date | null;

    // Audit stamps — server-side only, never part of the upsert input.
    @Field(() => Int, { nullable: true })
    created_by_id: number | null;

    @Field(() => Int, { nullable: true })
    updated_by_id: number | null;
}

// The acceptance Pedido step, as a diagnostic tri-state. The completion marker
// (order_request_completed_at) is authoritative; a linked pedido row without it
// is a half-state the diagnostics tab surfaces, never "done".
export enum OrderQuotationPedidoStepState {
    // No pedido has ever been linked to this quotation.
    NOT_CREATED = 'NOT_CREATED',
    // A pedido row exists (ignoring active) but its creation was never stamped
    // completed — a software fault mid-acceptance. Blocks the step; an engineer
    // diagnoses it. The app never creates a second pedido or repairs this one.
    CREATED_INCOMPLETE = 'CREATED_INCOMPLETE',
    // order_request_completed_at is set: the pedido creation returned cleanly.
    COMPLETED = 'COMPLETED',
}

registerEnumType(OrderQuotationPedidoStepState, {
    name: 'OrderQuotationPedidoStepState',
});

// One row of the acceptance PREVIEW: what accepting will do to this line in the
// client's catalog. Read-only (getOrderQuotationCatalogChanges writes nothing).
export enum OrderQuotationCatalogAction {
    // Product absent from the client's catalog → a row will be added.
    AGREGAR = 'AGREGAR',
    // Present at a different price → the price will be updated.
    ACTUALIZAR = 'ACTUALIZAR',
    // Present at the same price → nothing changes.
    SIN_CAMBIO = 'SIN_CAMBIO',
}

registerEnumType(OrderQuotationCatalogAction, {
    name: 'OrderQuotationCatalogAction',
});

@ObjectType('OrderQuotationCatalogChange')
export class OrderQuotationCatalogChange {
    @Field(() => Int, { nullable: false })
    product_id: number;

    @Field(() => String, { nullable: false })
    description: string;

    // Current catalog prices, or null when the product is not in the catalog yet.
    @Field(() => Float, { nullable: true })
    current_kilo_price: number | null;

    @Field(() => Float, { nullable: true })
    current_group_price: number | null;

    @Field(() => Float, { nullable: false })
    proposed_kilo_price: number;

    @Field(() => Float, { nullable: false })
    proposed_group_price: number;

    @Field(() => OrderQuotationCatalogAction, { nullable: false })
    action: OrderQuotationCatalogAction;
}

@ObjectType('OrderQuotationCatalogPreview')
export class OrderQuotationCatalogPreview {
    // One entry per LINKED quoted line. Free lines are not catalog changes — they
    // surface in blocking_reasons instead, since a free line blocks acceptance.
    @Field(() => [OrderQuotationCatalogChange], { nullable: false })
    changes: OrderQuotationCatalogChange[];

    // Why the Aceptar button is disabled, spelled out (free lines named, account
    // not a client, expired, terminal status). Empty when acceptable.
    @Field(() => [String], { nullable: false })
    blocking_reasons: string[];

    @Field(() => Boolean, { nullable: false })
    is_acceptable: boolean;
}

@ArgsType()
export class GetOrderQuotationsArgs {
    @Field(() => [Int], { nullable: true })
    order_quotation_status_ids?: number[] | null;
}

@ObjectType()
export class PaginatedOrderQuotations extends OffsetPaginatorResult(
    OrderQuotation,
) {}

@ArgsType()
export class PaginatedOrderQuotationsQueryArgs {
    @Field(() => String, { nullable: true })
    filter: string;

    @Field(() => Int, { nullable: true })
    account_id: number | null;

    @Field(() => Int, { nullable: true })
    order_quotation_status_id: number | null;
}

export enum OrderQuotationsSortableFields {
    order_code = 'order_code',
    estimated_delivery_date = 'estimated_delivery_date',
    expiration_date = 'expiration_date',
    date = 'date',
}

registerEnumType(OrderQuotationsSortableFields, {
    name: 'OrderQuotationsSortableFields',
});

@ArgsType()
export class OrderQuotationsSortArgs {
    @Field(() => ColumnOrder, { nullable: true })
    sort_order: ColumnOrder | null;

    @Field(() => OrderQuotationsSortableFields, { nullable: true })
    sort_field: OrderQuotationsSortableFields | null;
}
