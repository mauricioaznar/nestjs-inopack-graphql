import { Query, Resolver, Subscription } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { Activity } from '../../common/dto/entities';
import { ActivitiesService } from './activities.service';
import { ActivitiesPubSubService } from '../../common/modules/activities-pub-sub/activities-pub-sub.service';

@Resolver(() => Activity)
@Injectable()
export class ActivitiesResolver {
    constructor(
        private activitiesService: ActivitiesService,
        private activitiesPubSubService: ActivitiesPubSubService,
    ) {}

    @Query(() => [Activity])
    async getActivities() {
        return this.activitiesService.getActivities();
    }

    @Subscription(() => Activity)
    async activity() {
        return this.activitiesPubSubService.listenForActivity();
    }
}
