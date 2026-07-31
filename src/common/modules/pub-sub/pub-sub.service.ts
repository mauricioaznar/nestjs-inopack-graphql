import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { PrismaService } from '../prisma/prisma.service';
import {
    Account,
    ActivityEntityName,
    ActivityTypeName,
    Expense,
    ExpenseResource,
    Machine,
    OrderRequest,
    OrderSale,
    Product,
    Resource,
    Transfer,
    User,
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

    async product({
        product,
        type,
        userId,
    }: {
        product: Product;
        type: ActivityTypeName;
        userId: number;
    }) {
        await this.pubSub.publish('product', { product: product });
        await this.publishActivity({
            entity_name: ActivityEntityName.PRODUCT,
            type: type,
            entity_id: product.id,
            userId,
            description: `Producto: ${product.external_description} (${product.code})`,
        });
    }

    async orderProduction({
        orderProduction,
        type,
        userId,
    }: {
        orderProduction: OrderProduction;
        type: ActivityTypeName;
        userId: number;
    }) {
        await this.pubSub.publish('order_production', {
            order_production: orderProduction,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.ORDER_PRODUCTION,
            type: type,
            entity_id: orderProduction.id,
            userId,
            description: `Producción: ${orderProduction.start_date}`,
        });
    }

    async machine({
        machine,
        type,
        userId,
    }: {
        machine: Machine;
        type: ActivityTypeName;
        userId: number;
    }) {
        await this.pubSub.publish('machine', {
            machine: machine,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.MACHINE,
            type: type,
            entity_id: machine.id,
            userId,
            description: `Maquina: ${machine.name}`,
        });
    }

    async orderAdjustment({
        orderAdjustment,
        type,
        userId,
    }: {
        orderAdjustment: OrderAdjustment;
        type: ActivityTypeName;
        userId: number;
    }) {
        await this.pubSub.publish('order_adjustment', {
            order_adjustment: orderAdjustment,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.ORDER_ADJUSTMENT,
            type: type,
            entity_id: orderAdjustment.id,
            userId,
            description: `Ajuste: ${orderAdjustment.date}`,
        });
    }

    async employee({
        employee,
        type,
        userId,
    }: {
        employee: Employee;
        type: ActivityTypeName;
        userId: number;
    }) {
        await this.pubSub.publish('employee', {
            employee: employee,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.EMPLOYEE,
            type: type,
            entity_id: employee.id,
            userId,
            description: `Empleado: ${employee.fullname}`,
        });
    }

    async account({
        account,
        type,
        userId,
    }: {
        account: Account;
        type: ActivityTypeName;
        userId: number;
    }) {
        await this.pubSub.publish('account', {
            account: account,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.ACCOUNT,
            type: type,
            entity_id: account.id,
            userId,
            description: `Cuenta: ${account.abbreviation} (${account.name})`,
        });
    }

    async user({
        user,
        type,
        userId,
    }: {
        user: User;
        type: ActivityTypeName;
        userId: number;
    }) {
        await this.pubSub.publish('user', {
            user: user,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.USER,
            type: type,
            entity_id: user.id,
            userId,
            description: `Usuario: ${user.fullname} (${user.email})`,
        });
    }

    async orderRequest({
        orderRequest,
        type,
        userId,
    }: {
        orderRequest: OrderRequest;
        type: ActivityTypeName;
        userId: number;
    }) {
        await this.pubSub.publish('order_request', {
            order_request: orderRequest,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.ORDER_REQUEST,
            type: type,
            entity_id: orderRequest.id,
            userId,
            description: `Pedido: ${orderRequest.order_code}`,
        });
    }

    async orderSale({
        orderSale,
        type,
        userId,
        oldData,
        newData,
    }: {
        orderSale: OrderSale;
        type: ActivityTypeName;
        userId: number;
        // Audit snapshots. Optional so that any caller not yet wired keeps
        // compiling and simply records no snapshot.
        oldData?: unknown;
        newData?: unknown;
    }) {
        await this.pubSub.publish('order_sale', {
            order_sale: orderSale,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.ORDER_SALE,
            type: type,
            entity_id: orderSale.id,
            userId,
            description: `Venta: ${orderSale.order_code}`,
            oldData,
            newData,
        });
    }

    async transfer({
        transfer,
        type,
        userId,
    }: {
        transfer: Transfer;
        type: ActivityTypeName;
        userId: number;
    }) {
        await this.pubSub.publish('transfer', {
            transfer: transfer,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.TRANSFER,
            type: type,
            entity_id: transfer.id,
            userId,
            description: `Transferencia: ${transfer.id}`,
        });
    }

    async resource({
        resource,
        type,
        userId,
    }: {
        resource: Resource;
        type: ActivityTypeName;
        userId: number;
    }) {
        await this.pubSub.publish('resource', {
            resource: resource,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.RESOURCE,
            type: type,
            entity_id: resource.id,
            userId,
            description: `Recurso: ${resource.id}`,
        });
    }

    async expense({
        expense,
        type,
        userId,
    }: {
        expense: Expense;
        type: ActivityTypeName;
        userId: number;
    }) {
        await this.pubSub.publish('expense', {
            expense: expense,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.EXPENSE,
            type: type,
            entity_id: expense.id,
            userId,
            description: `Compra: ${expense.id}`,
        });
    }

    async expenseResource({
        expenseResource,
        type,
        userId,
    }: {
        expenseResource: ExpenseResource;
        type: ActivityTypeName;
        userId: number;
    }) {
        await this.pubSub.publish('expense_resource', {
            expense_resource: expenseResource,
        });
        await this.publishActivity({
            entity_name: ActivityEntityName.EXPENSE_RESOURCE,
            type: type,
            entity_id: expenseResource.id,
            userId,
            description: `Compra: ${expenseResource.id}`,
        });
    }

    async publishActivity({
        entity_id,
        entity_name,
        type,
        userId,
        description,
        oldData,
        newData,
    }: {
        entity_id: number;
        entity_name: ActivityEntityName;
        type: ActivityTypeName;
        userId: number;
        description: string;
        // Every entity funnels through here, so all activities CAN carry
        // snapshots; only the wired entities actually pass them. Undefined
        // leaves the column NULL rather than writing JSON null.
        oldData?: unknown;
        newData?: unknown;
    }) {
        const activity = await this.prisma.activities.create({
            data: {
                entity_name: entity_name,
                description: description,
                created_at: new Date(),
                updated_at: new Date(),
                entity_id: entity_id,
                type: type,
                user_id: userId,
                // Omitted rather than set to null: this is a create, so an
                // absent field leaves the column at its NULL default. Passing a
                // literal null to a Prisma `Json?` field is rejected — Prisma
                // wants Prisma.DbNull / Prisma.JsonNull to disambiguate SQL NULL
                // from JSON null — and omitting sidesteps that entirely.
                old_data:
                    oldData === undefined || oldData === null
                        ? undefined
                        : (oldData as any),
                new_data:
                    newData === undefined || newData === null
                        ? undefined
                        : (newData as any),
            },
        });

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

    async listenForMachine() {
        return this.pubSub.asyncIterator('machine');
    }

    async listenForRawMaterialAddition() {
        return this.pubSub.asyncIterator('raw_material_addition');
    }

    async listenForOrderAdjustment() {
        return this.pubSub.asyncIterator('order_adjustment');
    }

    async listenForEmployee() {
        return this.pubSub.asyncIterator('employee');
    }

    async listenForTransfer() {
        return this.pubSub.asyncIterator('transfer');
    }

    async listenForResource() {
        return this.pubSub.asyncIterator('resource');
    }

    async listenForAccount() {
        return this.pubSub.asyncIterator('account');
    }

    async listenForOrderRequest() {
        return this.pubSub.asyncIterator('order_request');
    }

    async listenForOrderSale() {
        return this.pubSub.asyncIterator('order_sale');
    }

    async listenForUser() {
        return this.pubSub.asyncIterator('user');
    }

    async listenForExpense() {
        return this.pubSub.asyncIterator('expense');
    }

    async listenForExpenseResource() {
        return this.pubSub.asyncIterator('expense_resource');
    }
}
