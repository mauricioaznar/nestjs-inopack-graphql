import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import {
  AccessToken,
  LoginInput,
  User,
  UserInput,
} from '../common/dto/entities/auth.dto';
import { Injectable, UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserService } from './user.service';

@Resolver(() => User)
@Injectable()
export class AuthResolver {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Mutation(() => AccessToken)
  async login(@Args('loginInput') input: LoginInput) {
    return this.authService.login(input);
  }

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  async currentUser(@CurrentUser() currentUser: User) {
    return this.userService.findOneByUsername({
      username: currentUser.username,
    });
  }

  @Query(() => String, { nullable: true })
  async getServerVersion() {
    return process.env.npm_package_version;
  }

  @Query(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async isUserOccupied(@Args('username') username: string) {
    const user = await this.userService.findOneByUsername({
      username,
    });
    return !!user;
  }

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard)
  async createUser(@Args('userInput') input: UserInput) {
    return this.userService.create(input);
  }

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard)
  async updateUser(
    @Args('id') id: number,
    @Args('userInput') input: UserInput,
  ) {
    return this.userService.update(id, input);
  }

  @Query(() => [User])
  @UseGuards(GqlAuthGuard)
  async users() {
    return this.userService.findAll();
  }
}
