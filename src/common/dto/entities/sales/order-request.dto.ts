import { ArgsType, Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { OrderRequestProductInput } from './order-request-product.dto';
import { OffsetPaginatorResult } from '../../pagination/offset-paginator-result/offset-paginator-result';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderRequestBase {
    @Field({ nullable: false })
    date: Date;

    @Field()
    order_code: number;

    @Field(() => Date, { nullable: true })
    estimated_delivery_date: Date | null;

    @Field(() => Int, { nullable: true })
    client_id?: number | null;

    @Field(() => Int, { nullable: true })
    order_request_status_id?: number | null;
}

@InputType('OrderRequestInput')
export class OrderRequestInput extends OrderRequestBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;

    @Field(() => [OrderRequestProductInput])
    order_request_products: OrderRequestProductInput[];
}

@ObjectType('OrderRequest')
export class OrderRequest extends OrderRequestBase {
    @Field({ nullable: false })
    id: number;
}

@ArgsType()
export class GetOrderRequestsArgs {
    @Field(() => Int, { nullable: true })
    order_request_status_id?: number | null;
}

@ObjectType()
export class PaginatedOrderRequests extends OffsetPaginatorResult(
    OrderRequest,
) {}
