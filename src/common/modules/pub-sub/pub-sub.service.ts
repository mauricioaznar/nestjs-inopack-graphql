import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { PrismaService } from '../prisma/prisma.service';
import {
    ActivityEntityName,
    ActivityTypeName,
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
        userId,
    }: {
        product: Product;
        create: boolean;
        userId: number;
    }) {
        await this.pubSub.publish('product', { product: product });
        await this.publishActivity({
            entity_name: ActivityEntityName.PRODUCT,
            type: create ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            entity_id: product.id,
            userId,
        });
    }

    async publishOrderProduction({
        orderProduction,
        create,
        userId,
    }: {
        orderProduction: OrderProduction;
        create: boolean;
        userId: number;
    }) {
        await this.pubSub.publish('order_production', {
            order_production: orderProduction,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.ORDER_PRODUCTION,
            type: create ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            entity_id: orderProduction.id,
            userId,
        });
    }

    async publishOrderAdjustment({
        orderAdjustment,
        create,
        userId,
    }: {
        orderAdjustment: OrderAdjustment;
        create: boolean;
        userId: number;
    }) {
        await this.pubSub.publish('order_adjustment', {
            order_adjustment: orderAdjustment,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.ORDER_ADJUSTMENT,
            type: create ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            entity_id: orderAdjustment.id,
            userId,
        });
    }

    async publishEmployee({
        employee,
        create,
        userId,
    }: {
        employee: Employee;
        create: boolean;
        userId: number;
    }) {
        await this.pubSub.publish('employee', {
            employee: employee,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.EMPLOYEE,
            type: create ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            entity_id: employee.id,
            userId,
        });
    }

    async publishClient({
        client,
        create,
        userId,
    }: {
        client: Client;
        create: boolean;
        userId: number;
    }) {
        await this.pubSub.publish('client', {
            client: client,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.CLIENT,
            type: create ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            entity_id: client.id,
            userId,
        });
    }

    async publishOrderRequest({
        orderRequest,
        create,

        userId,
    }: {
        orderRequest: OrderRequest;
        create: boolean;
        userId: number;
    }) {
        await this.pubSub.publish('order_request', {
            order_request: orderRequest,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.ORDER_REQUEST,
            type: create ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            entity_id: orderRequest.id,
            userId,
        });
    }

    async publishOrderSale({
        orderSale,
        create,
        userId,
    }: {
        orderSale: OrderSale;
        create: boolean;
        userId: number;
    }) {
        await this.pubSub.publish('order_sale', {
            order_sale: orderSale,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.ORDER_SALE,
            type: create ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            entity_id: orderSale.id,
            userId,
        });
    }

    async publishActivity({
        entity_id,
        entity_name,
        type,
        userId,
    }: {
        entity_id: number;
        entity_name: ActivityEntityName;
        type: ActivityTypeName;
        userId: number;
    }) {
        const activity = await this.prisma.activities.create({
            data: {
                entity_name: entity_name,
                description: '',
                created_at: new Date(),
                updated_at: new Date(),
                entity_id: entity_id,
                type: type,
                user_id: userId,
            },
        });

        console.log(activity);

        await this.pubSub.publish('activity', { activity: activity });
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
