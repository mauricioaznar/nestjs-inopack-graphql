import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccessToken, LoginInput, User } from '../common/dto/entities/auth.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/services/prisma/prisma.service';

interface UserWithPassword extends User {
  password: string;
}

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService, private prisma: PrismaService) {}

  async validateUser(
    username: string,
    pass: string,
  ): Promise<UserWithPassword | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        username: username,
      },
    });
    if (!user) {
      return null;
    }
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      return null;
    }
    return user;
  }

  async login(userInput: LoginInput): Promise<AccessToken> {
    const res = await this.validateUser(userInput.username, userInput.password);
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
