import {
    Body,
    Controller,
    Get,
    Post,
    UnauthorizedException,
} from '@nestjs/common';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginInput } from '../../common/dto/entities/auth.dto';
import { UserService } from './user.service';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private userService: UserService,
    ) {}

    @Public()
    @Post('login')
    async login(@Body() loginDto: LoginInput) {
        const result = await this.authService.login(loginDto);
        if (result) return result;
        throw new UnauthorizedException('Invalid auth-program tokens');
    }

    @Get('users')
    async users() {
        return this.userService.findAll();
    }
}
