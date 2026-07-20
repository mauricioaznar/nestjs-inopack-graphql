import { ArgsType, Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { OrderProductionProductInput } from './order-production-product.dto';
import { OrderProductionEmployeeInput } from './order-production-employee.dto';
import { OffsetPaginatorResult } from '../../pagination/offset-paginator-result/offset-paginator-result';
import { OrderProductionResourceInput } from './order-production-resource.dto';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderProductionBase {
    @Field({ nullable: false })
    start_date: Date;

    @Field({ nullable: false })
    waste: number;

    @Field(() => Int, { nullable: true })
    branch_id: number | null;

    @Field(() => Int, { nullable: true })
    order_production_type_id: number | null;

    @Field(() => Int, { nullable: true })
    shift: number | null;
}

@InputType('OrderProductionInput')
export class OrderProductionInput extends OrderProductionBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;

    @Field(() => [OrderProductionProductInput])
    order_production_products: OrderProductionProductInput[];

    @Field(() => [OrderProductionResourceInput])
    order_production_resources: OrderProductionResourceInput[];

    @Field(() => [OrderProductionEmployeeInput])
    order_production_employees: OrderProductionEmployeeInput[];
}

@ObjectType('OrderProduction')
export class OrderProduction extends OrderProductionBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Date, { nullable: true })
    updated_at: Date | null;

    // Audit stamps — server-side only, never part of the upsert input.
    @Field(() => Int, { nullable: true })
    created_by_id: number | null;

    @Field(() => Int, { nullable: true })
    updated_by_id: number | null;
}

@ObjectType()
export class PaginatedOrderProductions extends OffsetPaginatorResult(
    OrderProduction,
) {}

@ArgsType()
export class OrderProductionQueryArgs {
    @Field(() => String, { nullable: true })
    filter: string | null;

    @Field(() => Int, { nullable: true })
    order_production_type_id: number | null;

    @Field(() => Int, { nullable: true })
    branch_id: number | null;

    @Field(() => Int, { nullable: true })
    machine_id: number | null;

    @Field(() => Int, { nullable: true })
    product_id: number | null;
}
