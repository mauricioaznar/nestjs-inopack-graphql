import { ArgsType, Field, InputType, ObjectType } from '@nestjs/graphql';
import { OrderRequestProductInput } from './order-request-product.dto';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderRequestBase {
    @Field({ nullable: true })
    date: Date | null;

    @Field()
    order_code: number;

    @Field({ nullable: true })
    estimated_delivery_date: Date | null;

    @Field()
    client_id: number;

    @Field()
    order_request_status_id: number;
}

@InputType('OrderRequestInput')
export class OrderRequestInput extends OrderRequestBase {
    @Field({ nullable: true })
    id: number | null;

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
    @Field({ nullable: true, description: 'Order request status' })
    order_request_status_id?: number | null;
}
