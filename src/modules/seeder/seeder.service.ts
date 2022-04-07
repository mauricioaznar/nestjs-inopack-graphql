import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { User } from '../../common/dto/entities/auth.dto';
import { UserService } from '../auth/user.service';
import { adminUser } from '../../common/__tests__/objects/users';
import { PartCategorySeederService } from './modules/part-category-seeder/part-category-seeder.service';
import { PartSeederService } from './modules/part-seeder/part-seeder.service';
import { MachineSeederService } from './modules/machine-seeder/machine-seeder.service';

@Injectable()
export class SeederService {
  constructor(
    private readonly userService: UserService,
    private readonly partCategorySeederService: PartCategorySeederService,
    private readonly partSeederService: PartSeederService,
    private readonly machineSeederService: MachineSeederService,
  ) {}

  async seed() {
    await this.user();
    const machines = await this.machineSeederService.getMachines();
    const categories =
      await this.partCategorySeederService.createPartCategories();
    await this.partSeederService.createParts(categories);
  }

  async user(): Promise<User> {
    return this.userService.create({
      email: adminUser.email,
      password: adminUser.password,
    });
  }
}
