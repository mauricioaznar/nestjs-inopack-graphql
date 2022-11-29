import { ArgsType, Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { OrderProductionProductInput } from './order-production-product.dto';
import { OrderProductionEmployeeInput } from './order-production-employee.dto';
import { OffsetPaginatorResult } from '../../pagination/offset-paginator-result/offset-paginator-result';

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
}

@InputType('OrderProductionInput')
export class OrderProductionInput extends OrderProductionBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;

    @Field(() => [OrderProductionProductInput])
    order_production_products: OrderProductionProductInput[];

    @Field(() => [OrderProductionEmployeeInput])
    order_production_employees: OrderProductionEmployeeInput[];
}

@ObjectType('OrderProduction')
export class OrderProduction extends OrderProductionBase {
    @Field({ nullable: false })
    id: number;
}

@ObjectType()
export class PaginatedOrderProductions extends OffsetPaginatorResult(
    OrderProduction,
) {}

@ArgsType()
export class OrderProductionQueryArgs {
    @Field(() => Int, { nullable: true })
    order_production_type_id: number;

    @Field(() => Int, { nullable: true })
    branch_id: number;
}
