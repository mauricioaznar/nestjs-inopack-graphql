import { Global, Module } from '@nestjs/common';
import { PubSubService } from './pub-sub.service';
import { ActivityTitleService } from './activity-title.service';

@Global()
@Module({
    providers: [PubSubService, ActivityTitleService],
    exports: [PubSubService],
})
export class PubSubModule {}
