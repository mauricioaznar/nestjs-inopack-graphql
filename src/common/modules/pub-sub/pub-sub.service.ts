import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { PrismaService } from '../prisma/prisma.service';
import {
    ActivityEntityName,
    ActivityInput,
    Client,
    OrderRequest,
    OrderSale,
    Product,
} from '../../dto/entities';
import { OrderProduction } from '../../dto/entities/production/order-production.dto';
import { OrderAdjustment } from '../../dto/entities/production/order-adjustment.dto';
import { Employee } from '../../dto/entities/production/employee.dto';

@Injectable()
export class PubSubService {
    private pubSub: PubSub;

    constructor(private prisma: PrismaService) {
        this.pubSub = new PubSub();
    }

    async publishProduct({
        product,
        create,
    }: {
        product: Product;
        create: boolean;
    }) {
        await this.pubSub.publish('product', { product: product });
        await this.publishActivity();
    }

    async publishOrderProduction({
        orderProduction,
    }: {
        orderProduction: OrderProduction;
        create: boolean;
    }) {
        await this.pubSub.publish('order_production', {
            order_production: orderProduction,
        });
        await this.publishActivity();
    }

    async publishOrderAdjustment({
        orderAdjustment,
        create,
    }: {
        orderAdjustment: OrderAdjustment;
        create: boolean;
    }) {
        await this.pubSub.publish('order_adjustment', {
            order_adjustment: orderAdjustment,
        });
        await this.publishActivity();
    }

    async publishEmployee({
        employee,
        create,
    }: {
        employee: Employee;
        create: boolean;
    }) {
        await this.pubSub.publish('employee', {
            employee: employee,
        });
        await this.publishActivity();
    }

    async publishClient({
        client,
        create,
    }: {
        client: Client;
        create: boolean;
    }) {
        await this.pubSub.publish('client', {
            client: client,
        });
        await this.publishActivity();
    }

    async publishOrderRequest({
        orderRequest,
    }: {
        orderRequest: OrderRequest;
        create: boolean;
    }) {
        await this.pubSub.publish('order_request', {
            order_request: orderRequest,
        });
        await this.publishActivity();
    }

    async publishOrderSale({
        orderSale,
        create,
    }: {
        orderSale: OrderSale;
        create: boolean;
    }) {
        await this.pubSub.publish('order_sale', {
            order_sale: orderSale,
        });
        await this.publishActivity();
    }

    async publishActivity() {
        const lastActivity = await this.prisma.activities.findFirst();
        console.log(
            lastActivity?.entity_name === ActivityEntityName.ORDER_PRODUCTION,
        );
        await this.pubSub.publish('activity', { activity: lastActivity });
    }

    async listenForActivity() {
        return this.pubSub.asyncIterator('activity');
    }

    async listenForProduct() {
        return this.pubSub.asyncIterator('product');
    }

    async listenForOrderProduction() {
        return this.pubSub.asyncIterator('order_production');
    }

    async listenForOrderAdjustment() {
        return this.pubSub.asyncIterator('order_adjustment');
    }

    async listenForEmployee() {
        return this.pubSub.asyncIterator('employee');
    }

    async listenForClient() {
        return this.pubSub.asyncIterator('client');
    }

    async listenForOrderRequest() {
        return this.pubSub.asyncIterator('order_request');
    }

    async listenForOrderSale() {
        return this.pubSub.asyncIterator('order_sale');
    }
}
