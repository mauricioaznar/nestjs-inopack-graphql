import {
    Args,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { AuthService } from './auth.service';
import {
    AccessToken,
    ActivityTypeName,
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
import { Role, RoleId } from '../../common/dto/entities/auth/role.dto';
import { PubSubService } from '../../common/modules/pub-sub/pub-sub.service';
import { RolesDecorator } from './decorators/role.decorator';

@Resolver(() => User)
@Injectable()
export class AuthResolver {
    constructor(
        private authService: AuthService,
        private userService: UserService,
        private pubSubService: PubSubService,
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

    @Query(() => [User])
    @UseGuards(GqlAuthGuard)
    async users() {
        return this.userService.findAll();
    }

    @Query(() => User, { nullable: true })
    @RolesDecorator(RoleId.SUPER)
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
    @RolesDecorator(RoleId.SUPER)
    async createUser(
        @Args('CreateUserInput') input: CreateUserInput,
        @CurrentUser() currentUser: User,
    ) {
        const user = await this.userService.create(input);

        await this.pubSubService.user({
            user,
            userId: currentUser.id,
            type: ActivityTypeName.CREATE,
        });

        return user;
    }

    @Mutation(() => User)
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.SUPER)
    async updateUser(
        @Args('UpdateUserInput') input: UpdateUserInput,
        @CurrentUser() currentUser: User,
    ) {
        const user = await this.userService.update(input);

        await this.pubSubService.user({
            user,
            userId: currentUser.id,
            type: ActivityTypeName.UPDATE,
        });

        return user;
    }

    @ResolveField(() => [Role])
    @UseGuards(GqlAuthGuard)
    async roles(@Parent() user: User): Promise<Role[]> {
        return this.userService.getUserRoles({ user_id: user.id });
    }

    @ResolveField(() => [RoleId])
    @UseGuards(GqlAuthGuard)
    async role_ids(@Parent() user: User): Promise<RoleId[]> {
        const roles = await this.userService.getUserRoles({ user_id: user.id });
        return roles.map((role) => role.id);
    }

    @Subscription(() => User)
    @UseGuards(GqlAuthGuard)
    async user() {
        return this.pubSubService.listenForUser();
    }
}
