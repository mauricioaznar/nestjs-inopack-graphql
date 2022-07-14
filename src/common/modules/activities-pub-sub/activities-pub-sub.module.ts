import { Global, Module } from '@nestjs/common';
import { ActivitiesPubSubService } from './activities-pub-sub.service';

@Global()
@Module({
    providers: [ActivitiesPubSubService],
    exports: [ActivitiesPubSubService],
})
export class ActivitiesPubSubModule {}
