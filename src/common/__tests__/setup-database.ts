import { PrismaService } from '../services/prisma/prisma.service';
import { adminUser } from './objects/users';
import { UserService } from '../../modules/auth/user.service';
import { setupApp } from './helpers/setup-app';
import {
    orderProductionTypes,
    packings,
    productTypeCategories,
    productTypes,
} from './objects';

export default async function setupDatabase() {
    const app = await setupApp();
    const prismaService = app.get(PrismaService);

    /* DELETION */

    // level 4
    await prismaService.products.deleteMany();

    // level 3
    await prismaService.product_type.deleteMany();

    //level 2
    await prismaService.product_type_categories.deleteMany();
    await prismaService.order_production_type.deleteMany();
    await prismaService.packings.deleteMany();

    // level 1
    await prismaService.users.deleteMany();

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

    await app.close();
}
