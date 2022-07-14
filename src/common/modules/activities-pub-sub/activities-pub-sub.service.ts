import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivitiesPubSubService {
    private pubSub: PubSub;

    constructor(private prisma: PrismaService) {
        this.pubSub = new PubSub();
    }

    async publishActivity() {
        const lastActivity = await this.prisma.activities.findFirst();
        await this.pubSub.publish('activity', { activity: lastActivity });
    }

    async listenForActivity() {
        return this.pubSub.asyncIterator('activity');
    }
}
