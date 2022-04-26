import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccessToken, LoginInput, User } from '../../common/dto/entities';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/services/prisma/prisma.service';

interface UserWithPassword extends User {
    password: string;
}

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) {}

    async validateUser(
        email: string,
        pass: string,
    ): Promise<UserWithPassword | null> {
        const user = await this.prisma.users.findFirst({
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
        const { password, ...rest } = res;
        return {
            accessToken: this.jwtService.sign({ ...rest }),
        };
    }
}
