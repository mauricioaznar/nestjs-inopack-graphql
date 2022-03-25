import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma/prisma.service';
import { User } from '../common/dto/entities/auth.dto';
import { UserService } from '../auth/user.service';
import { adminUser } from '../common/__tests__/objects/users';

@Injectable()
export class SeederService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
    private readonly userService: UserService,
  ) {}

  async seed() {
    await this.user();
  }

  async user(): Promise<User> {
    return this.userService.create({
      username: adminUser.username,
      password: adminUser.password,
    });
  }
}
