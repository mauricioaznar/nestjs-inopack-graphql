import { BadRequestException, Injectable } from '@nestjs/common';
import {
    CreateUserInput,
    UpdateUserInput,
    User,
} from '../../common/dto/entities';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/modules/prisma/prisma.service';
import { Role } from '../../common/dto/entities/auth/role.dto';
import { vennDiagram } from '../../common/helpers';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async findOneByEmail({ email }: { email: string }): Promise<User | null> {
        return this.prisma.users.findFirst({
            where: {
                email,
                active: 1,
            },
        });
    }

    async findUser({ user_id }: { user_id: number }): Promise<User | null> {
        return this.prisma.users.findFirst({
            where: {
                id: user_id,
            },
        });
    }

    async findAll(): Promise<User[]> {
        return this.prisma.users.findMany();
    }

    async create(userInput: CreateUserInput): Promise<User> {
        await this.validateCreateUser(userInput);

        const saltOrRounds = 10;
        const password = await bcrypt.hash(userInput.password, saltOrRounds);
        const user = await this.prisma.users.create({
            data: {
                id: userInput.id || undefined,
                email: userInput.email,
                first_name: userInput.first_name,
                last_name: userInput.last_name,
                fullname: `${userInput.first_name} ${userInput.last_name}`,
                password,
            },
        });

        for await (const role of userInput.roles) {
            await this.prisma.user_roles.create({
                data: {
                    user_id: user.id,
                    role_id: role.id,
                },
            });
        }

        return user;
    }

    async validateCreateUser(userInput: CreateUserInput): Promise<void> {
        const errors: string[] = [];

        const foundUser = await this.findOneByEmail({ email: userInput.email });
        if (!!foundUser) {
            errors.push(`email is already occupied`);
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }

    async update(userInput: UpdateUserInput): Promise<User> {
        await this.validateUpdateUser(userInput);

        const saltOrRounds = 10;
        const password = userInput.password
            ? await bcrypt.hash(userInput.password, saltOrRounds)
            : undefined;

        const previousRoles = await this.getUserRoles({
            user_id: userInput.id,
        });

        const user = await this.prisma.users.update({
            data: {
                email: userInput.email,
                first_name: userInput.first_name,
                last_name: userInput.last_name,
                fullname: `${userInput.first_name} ${userInput.last_name}`,
                password,
            },
            where: {
                id: userInput.id,
            },
        });

        const { aMinusB: deletedRoles, bMinusA: createdRoles } = vennDiagram({
            a: previousRoles,
            b: userInput.roles,
            indexProperties: ['id'],
        });

        for await (const role of deletedRoles) {
            await this.prisma.user_roles.deleteMany({
                where: {
                    role_id: role.id,
                    user_id: userInput.id,
                },
            });
        }

        for await (const role of createdRoles) {
            await this.prisma.user_roles.create({
                data: {
                    user_id: userInput.id,
                    role_id: role.id,
                },
            });
        }

        return user;
    }

    async validateUpdateUser(userInput: UpdateUserInput): Promise<void> {
        const errors: string[] = [];

        // is email occupied
        {
            const isEmailOccupied = await this.isEmailOccupied({
                email: userInput.email,
                user_id: userInput.id,
            });

            if (isEmailOccupied) {
                errors.push(`email is already occupied`);
            }
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }

    async isEmailOccupied({
        email,
        user_id,
    }: {
        email: string;
        user_id: number | null;
    }): Promise<boolean> {
        const user = await this.findOneByEmail({ email });
        return !!user_id && user_id >= 0 && user ? user.id !== user_id : !!user;
    }

    async getUserRoles({ user_id }: { user_id: number }): Promise<Role[]> {
        return this.prisma.roles.findMany({
            where: {
                user_roles: {
                    some: {
                        user_id: user_id,
                        active: 1,
                    },
                },
            },
        });
    }
}
