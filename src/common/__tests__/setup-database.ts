import { PrismaService } from '../services/prisma/prisma.service';
import { adminUser } from './objects/users';
import { UserService } from '../../modules/auth/user.service';
import { setupApp } from './helpers/setup-app';

export default async function setupDatabase() {
    const app = await setupApp();
    const prismaService = app.get(PrismaService);

    // cleaning
    await prismaService.users.deleteMany();

    // create
    const userService = app.get(UserService);
    await userService.create({ ...adminUser });

    await app.close();
}
