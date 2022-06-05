import { Injectable } from '@nestjs/common';
import { User, UserInput } from '../../common/dto/entities';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/modules/prisma/prisma.service';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async findOneByEmail({ email }: { email: string }): Promise<User> {
        return this.prisma.users.findFirst({
            where: {
                email,
            },
        });
    }

    async findAll(): Promise<User[]> {
        return this.prisma.users.findMany();
    }

    async create(userInput: UserInput): Promise<User> {
        const saltOrRounds = 10;
        const password = await bcrypt.hash(userInput.password, saltOrRounds);
        return this.prisma.users.create({
            data: {
                email: userInput.email,
                first_name: '',
                last_name: '',
                fullname: '',
                password,
            },
        });
    }

    async update(id: number, userInput: UserInput): Promise<User> {
        const saltOrRounds = 10;
        const password = await bcrypt.hash(userInput.password, saltOrRounds);
        return this.prisma.users.update({
            where: {
                id: id,
            },
            data: {
                email: userInput.email,
                password,
            },
        });
    }
}
