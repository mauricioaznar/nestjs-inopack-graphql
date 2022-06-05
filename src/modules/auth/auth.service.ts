import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
    AccessToken,
    LoginInput,
    UserWithRoles,
} from '../../common/dto/entities';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/modules/prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) {}

    async validateUser(
        email: string,
        pass: string,
    ): Promise<UserWithRoles | null> {
        const user = await this.prisma.users.findFirst({
            include: {
                user_roles: true,
            },
            where: {
                email: email,
            },
        });
        if (!user) {
            return null;
        }
        let storedPassword = user.password;
        if (user.password.match(/^\$2y(.+)$/i)) {
            storedPassword = user.password.replace(/^\$2y(.+)$/i, '$2a$1');
        }
        const isMatch = await bcrypt.compare(pass, storedPassword);
        if (!isMatch) {
            return null;
        }
        delete user.password;
        return user;
    }

    async login(userInput: LoginInput): Promise<AccessToken> {
        const res = await this.validateUser(
            userInput.email,
            userInput.password,
        );
        if (!res) {
            throw new BadRequestException(
                'Could not log-in with the provided credentials',
            );
        }
        const { ...rest } = res;
        return {
            accessToken: this.jwtService.sign({ ...rest }),
        };
    }
}
