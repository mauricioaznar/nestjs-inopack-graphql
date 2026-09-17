import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { User, UserConfig } from '../../common/dto/entities';
import { UserConfigService } from './user-config.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Resolver(() => UserConfig)
export class UserConfigResolver {
    constructor(private readonly userConfigService: UserConfigService) {}

    // The current user's own settings row (created on first read).
    @Query(() => UserConfig)
    @UseGuards(GqlAuthGuard)
    async myConfig(@CurrentUser() currentUser: User): Promise<UserConfig> {
        return this.userConfigService.getForUser({ user_id: currentUser.id });
    }

    @Mutation(() => UserConfig)
    @UseGuards(GqlAuthGuard)
    async setDarkMode(
        @CurrentUser() currentUser: User,
        @Args('dark_mode', { type: () => Boolean }) dark_mode: boolean,
    ): Promise<UserConfig> {
        return this.userConfigService.setDarkMode({
            user_id: currentUser.id,
            dark_mode,
        });
    }
}
