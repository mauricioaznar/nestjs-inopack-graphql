import { adminUser } from '../objects/users';
import { UserService } from '../../../modules/auth/user.service';
import { setupApp } from './setup-app';
import {
    orderProductionTypes,
    packings,
    productTypeCategories,
    productTypes,
} from '../objects';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { employeeStatuses } from '../objects/maintenance/employee-statuses';
import { branches } from '../objects/maintenance/branches';
import { orderAdjustmentTypes } from '../objects/production/order-adjustment-types';
import { orderRequestStatuses } from '../objects/sales/order-request-statuses';
import { orderSaleStatuses } from '../objects/sales/order-sale-statuses';
import { orderSaleReceiptTypes } from '../objects/sales/order-sale-receipt-types';
import { orderSaleCollectionStatuses } from '../objects/sales/order-sale-collection-statuses';

export default async function setupDatabase() {
    const app = await setupApp();
    const prismaService = app.get(PrismaService);

    /* DELETION */

    // level 6
    await prismaService.order_adjustment_products.deleteMany();
    await prismaService.order_production_products.deleteMany();
    await prismaService.order_production_employees.deleteMany();
    await prismaService.order_request_products.deleteMany();
    await prismaService.order_sale_payments.deleteMany();
    await prismaService.order_sale_products.deleteMany();

    // level 5
    await prismaService.order_adjustments.deleteMany();
    await prismaService.order_productions.deleteMany();
    await prismaService.order_sales.deleteMany();

    // level 4
    await prismaService.order_requests.deleteMany();
    await prismaService.products.deleteMany();

    // level 3
    await prismaService.machines.deleteMany();
    await prismaService.product_type.deleteMany();
    await prismaService.client_contacts.deleteMany();
    await prismaService.order_adjustment_type.deleteMany();
    await prismaService.employees.deleteMany();

    //level 2
    await prismaService.product_type_categories.deleteMany();
    await prismaService.order_production_type.deleteMany();
    await prismaService.packings.deleteMany();
    await prismaService.clients.deleteMany();
    await prismaService.employee_statuses.deleteMany();
    await prismaService.order_request_statuses.deleteMany();
    await prismaService.order_sale_statuses.deleteMany();
    await prismaService.order_sale_receipt_type.deleteMany();
    await prismaService.order_sale_collection_statuses.deleteMany();

    // level 1
    await prismaService.users.deleteMany();
    await prismaService.branches.deleteMany();

    /* CREATION */
    const userService = app.get(UserService);
    await userService.create({ ...adminUser });
    await prismaService.order_production_type.createMany({
        data: orderProductionTypes,
    });
    await prismaService.order_adjustment_type.createMany({
        data: orderAdjustmentTypes,
    });
    await prismaService.product_type_categories.createMany({
        data: productTypeCategories,
    });
    await prismaService.product_type.createMany({
        data: productTypes,
    });
    await prismaService.packings.createMany({
        data: packings,
    });
    await prismaService.employee_statuses.createMany({
        data: employeeStatuses,
    });
    await prismaService.branches.createMany({
        data: branches,
    });
    await prismaService.order_request_statuses.createMany({
        data: orderRequestStatuses,
    });
    await prismaService.order_sale_statuses.createMany({
        data: orderSaleStatuses,
    });
    await prismaService.order_sale_receipt_type.createMany({
        data: orderSaleReceiptTypes,
    });
    await prismaService.order_sale_collection_statuses.createMany({
        data: orderSaleCollectionStatuses,
    });

    await app.close();
}
