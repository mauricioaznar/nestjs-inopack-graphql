import { Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderProductionProductsService } from './order-production-products.service';
import { Public } from '../../../auth/decorators/public.decorator';
import { OrderProductionProduct } from '../../../../common/dto/entities/production/order-production-product.dto';

@Resolver(() => OrderProductionProduct)
@Public()
@Injectable()
export class OrderProductionProductsResolver {
    constructor(private service: OrderProductionProductsService) {}

    @Query(() => [OrderProductionProduct])
    async getOrderProductionProducts(): Promise<OrderProductionProduct[]> {
        return this.service.getOrderProductionProducts();
    }
}
