import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { ConfigService } from './config.service';
import { UpdateUserConfigInput, UserConfig } from '../../common/dto/entities';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../../common/dto/entities';

@Resolver(() => UserConfig)
@UseGuards(GqlAuthGuard)
@Injectable()
export class ConfigResolver {
    constructor(private configService: ConfigService) {}

    @Query(() => UserConfig)
    async getMyConfig(@CurrentUser() currentUser: User): Promise<UserConfig> {
        return this.configService.getMyConfig(currentUser.id);
    }

    @Mutation(() => UserConfig)
    async updateMyConfig(
        @Args('input') input: UpdateUserConfigInput,
        @CurrentUser() currentUser: User,
    ): Promise<UserConfig> {
        return this.configService.updateMyConfig(currentUser.id, input);
    }
}
