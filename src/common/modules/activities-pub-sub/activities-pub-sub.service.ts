import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivitiesPubSubService extends PubSub {
    constructor(private prisma: PrismaService) {
        super();
    }

    async publishActivity() {
        const lastActivity = await this.prisma.activities.findFirst();
        await this.publish('activity', { activity: lastActivity });
    }

    async listenForActivity() {
        return this.asyncIterator('activity');
    }
}
