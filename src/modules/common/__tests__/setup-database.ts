import { PrismaService } from '../services/prisma/prisma.service';
import { adminUser } from './objects/users';
import { UserService } from '../../auth/user.service';
import { setupApp } from './helpers/setup-app';

export default async function setupDatabase() {
  const app = await setupApp();
  const prismaService = app.get(PrismaService);

  // cleaning
  await prismaService.partAssignment.deleteMany();
  await prismaService.partAddition.deleteMany();
  await prismaService.partSubtraction.deleteMany();
  await prismaService.part.deleteMany();
  await prismaService.partCategory.deleteMany();
  await prismaService.user.deleteMany();

  // create
  const userService = app.get(UserService);
  await userService.create({ ...adminUser });

  await app.close();
}
