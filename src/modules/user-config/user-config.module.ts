import { Module } from '@nestjs/common';
import { UserConfigResolver } from './user-config.resolver';
import { UserConfigService } from './user-config.service';

@Module({
    providers: [UserConfigResolver, UserConfigService],
})
export class UserConfigModule {}
