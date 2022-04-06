import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { User } from '../../common/dto/entities/auth.dto';
import { UserService } from '../auth/user.service';
import { adminUser } from '../../common/__tests__/objects/users';
import { PartCategoryCreationService } from './modules/part-category-creation/part-category-creation.service';
import { PartCreationService } from './modules/part-creation/part-creation.service';

@Injectable()
export class SeederService {
  constructor(
    private readonly userService: UserService,
    private readonly partCategoryCreationService: PartCategoryCreationService,
    private readonly partCreationService: PartCreationService,
  ) {}

  async seed() {
    await this.user();
    const categories =
      await this.partCategoryCreationService.createPartCategories();
    await this.partCreationService.createParts(categories);
  }

  async user(): Promise<User> {
    return this.userService.create({
      email: adminUser.email,
      password: adminUser.password,
    });
  }
}
