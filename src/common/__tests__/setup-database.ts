import { adminUser } from './objects/users';
import { UserService } from '../../modules/auth/user.service';
import { setupApp } from './helpers/setup-app';
import {
    orderProductionTypes,
    packings,
    productTypeCategories,
    productTypes,
} from './objects';
import { PrismaService } from '../modules/prisma/prisma.service';
import { employeeStatuses } from './objects/maintenance/employee-statuses';
import { branches } from './objects/maintenance/branches';

export default async function setupDatabase() {
    const app = await setupApp();
    const prismaService = app.get(PrismaService);

    /* DELETION */

    // level 4
    await prismaService.products.deleteMany();

    // level 3
    await prismaService.machines.deleteMany();
    await prismaService.product_type.deleteMany();
    await prismaService.client_contacts.deleteMany();
    await prismaService.employees.deleteMany();

    //level 2
    await prismaService.product_type_categories.deleteMany();
    await prismaService.order_production_type.deleteMany();
    await prismaService.packings.deleteMany();
    await prismaService.clients.deleteMany();
    await prismaService.employee_statuses.deleteMany();

    // level 1
    await prismaService.users.deleteMany();
    await prismaService.branches.deleteMany();

    /* CREATION */
    const userService = app.get(UserService);
    await userService.create({ ...adminUser });
    await prismaService.order_production_type.createMany({
        data: orderProductionTypes,
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

    await app.close();
}
