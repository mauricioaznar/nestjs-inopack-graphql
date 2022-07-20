import {
    Args,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
} from '@nestjs/graphql';
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
import { Role } from '../../common/dto/entities/auth/role.dto';

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

    @Query(() => User, { nullable: true })
    async getUser(@Args('UserId') userId: number): Promise<User | null> {
        return this.userService.findUser({
            user_id: userId,
        });
    }

    @Query(() => String, { nullable: true })
    @UseGuards(GqlAuthGuard)
    async getServerVersion() {
        return process.env.npm_package_version;
    }

    @Query(() => Boolean)
    @UseGuards(GqlAuthGuard)
    async isEmailOccupied(
        @Args('Email') email: string,
        @Args('UserId', { nullable: true }) userId: number,
    ): Promise<boolean> {
        return this.userService.isEmailOccupied({ email, user_id: userId });
    }

    @Mutation(() => User)
    @UseGuards(GqlAuthGuard)
    async createUser(@Args('CreateUserInput') input: CreateUserInput) {
        return this.userService.create(input);
    }

    @Mutation(() => User)
    @UseGuards(GqlAuthGuard)
    async updateUser(@Args('UpdateUserInput') input: UpdateUserInput) {
        return this.userService.update(input);
    }

    @Query(() => [User])
    @UseGuards(GqlAuthGuard)
    async users() {
        return this.userService.findAll();
    }

    @ResolveField(() => [Role])
    @UseGuards(GqlAuthGuard)
    async roles(@Parent() user: User): Promise<Role[]> {
        return this.userService.getUserRoles({ user_id: user.id });
    }
}
