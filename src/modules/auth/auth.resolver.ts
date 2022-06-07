import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import {
    AccessToken,
    CreateUserInput,
    LoginInput,
    UpdateUserInput,
    User,
} from '../../common/dto/entities';
import { Injectable, UseGuards } from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserService } from './user.service';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { Public } from './decorators/public.decorator';

@Resolver(() => User)
@Injectable()
export class AuthResolver {
    constructor(
        private authService: AuthService,
        private userService: UserService,
    ) {}

    @Mutation(() => AccessToken)
    @Public()
    async login(@Args('loginInput') input: LoginInput) {
        return this.authService.login(input);
    }

    @Query(() => User)
    @UseGuards(GqlAuthGuard)
    async currentUser(@CurrentUser() currentUser: User) {
        return this.userService.findOneByEmail({
            email: currentUser.email,
        });
    }

    @Query(() => String, { nullable: true })
    async getServerVersion() {
        return process.env.npm_package_version;
    }

    @Query(() => Boolean)
    async isUserOccupied(@Args('email') email: string) {
        const user = await this.userService.findOneByEmail({
            email,
        });
        return !!user;
    }

    @Mutation(() => User)
    async createUser(@Args('CreateUserInput') input: CreateUserInput) {
        return this.userService.create(input);
    }

    @Mutation(() => User)
    async updateUser(@Args('UpdateUserInput') input: UpdateUserInput) {
        return this.userService.update(input);
    }

    @Query(() => [User])
    async users() {
        return this.userService.findAll();
    }
}
