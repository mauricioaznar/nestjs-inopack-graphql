import { Injectable } from '@nestjs/common';
import { User, UserInput } from '../common/dto/entities/auth.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/services/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findOneByUsername({ username }: { username: string }): Promise<User> {
    return this.prisma.user.findFirst({
      where: {
        username: username,
      },
    });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async create(userInput: UserInput): Promise<User> {
    const saltOrRounds = 10;
    const password = await bcrypt.hash(userInput.password, saltOrRounds);
    return this.prisma.user.create({
      data: {
        username: userInput.username,
        password,
      },
    });
  }

  async update(id: number, userInput: UserInput): Promise<User> {
    const saltOrRounds = 10;
    const password = await bcrypt.hash(userInput.password, saltOrRounds);
    return this.prisma.user.update({
      where: {
        id: id,
      },
      data: {
        username: userInput.username,
        password,
      },
    });
  }
}
