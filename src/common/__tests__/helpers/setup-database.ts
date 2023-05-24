import { adminUser, salesUser } from '../objects/auth/users';
import { UserService } from '../../../modules/auth/user.service';
import { setupApp } from './setup-app';
import { orderProductionTypes } from '../objects';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { employeeStatuses } from '../objects/maintenance/employee-statuses';
import { branches } from '../objects/maintenance/branches';
import { orderAdjustmentTypes } from '../objects/production/order-adjustment-types';
import { orderRequestStatuses } from '../objects/sales/order-request-statuses';
import { orderSaleStatuses } from '../objects/sales/order-sale-statuses';
import { orderSaleReceiptTypes } from '../objects/sales/order-sale-receipt-types';
import { orderSaleCollectionStatuses } from '../objects/sales/order-sale-collection-statuses';
import { roles } from '../objects/auth/roles';
import { productCategories } from '../objects/production/product-categories';
import { accountTypes } from '../objects/management/account-types';

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
    await prismaService.transfers.deleteMany();
    await prismaService.expense_resource.deleteMany();

    // level 5
    await prismaService.order_adjustments.deleteMany();
    await prismaService.order_productions.deleteMany();
    await prismaService.order_sales.deleteMany();
    await prismaService.expenses.deleteMany();

    // level 4
    await prismaService.order_requests.deleteMany();
    await prismaService.products.deleteMany();
    await prismaService.user_roles.deleteMany();
    await prismaService.account_contacts.deleteMany();

    // level 3
    await prismaService.machines.deleteMany();
    await prismaService.product_categories.deleteMany();
    await prismaService.order_adjustment_type.deleteMany();
    await prismaService.employees.deleteMany();
    await prismaService.accounts.deleteMany();

    //level 2
    await prismaService.order_production_type.deleteMany();
    await prismaService.employee_statuses.deleteMany();
    await prismaService.order_request_statuses.deleteMany();
    await prismaService.order_sale_statuses.deleteMany();
    await prismaService.order_sale_receipt_type.deleteMany();
    await prismaService.order_sale_collection_statuses.deleteMany();
    await prismaService.account_types.deleteMany();

    // level 1
    await prismaService.users.deleteMany();
    await prismaService.branches.deleteMany();
    await prismaService.roles.deleteMany();

    /* CREATION */
    const userService = app.get(UserService);
    await prismaService.roles.createMany({
        data: roles,
    });
    await userService.create({ ...adminUser });
    await userService.create({ ...salesUser });
    await prismaService.order_production_type.createMany({
        data: orderProductionTypes,
    });
    await prismaService.order_adjustment_type.createMany({
        data: orderAdjustmentTypes,
    });
    await prismaService.product_categories.createMany({
        data: productCategories,
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

    await prismaService.account_types.createMany({
        data: accountTypes,
    });

    await app.close();
}
