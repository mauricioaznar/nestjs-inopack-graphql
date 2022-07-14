import { Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { Activity } from '../../common/dto/entities';
import { ActivitiesService } from './activities.service';

@Resolver(() => Activity)
@Injectable()
export class ActivitiesResolver {
    constructor(private activitiesService: ActivitiesService) {}

    @Query(() => [Activity])
    async getActivities() {
        return this.activitiesService.getActivities();
    }
}
