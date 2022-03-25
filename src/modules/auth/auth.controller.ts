import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginInput } from '../common/dto/entities/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginInput) {
    const result = await this.authService.login(loginDto);
    if (result) return result;
    throw new UnauthorizedException('Invalid auth-program tokens');
  }
}
