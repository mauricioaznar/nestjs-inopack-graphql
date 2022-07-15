import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/modules/prisma/prisma.service';
import { Activity } from '../../common/dto/entities';

@Injectable()
export class ActivitiesService {
    constructor(private prisma: PrismaService) {}

    async getActivities(): Promise<Activity[]> {
        return this.prisma.activities.findMany({
            orderBy: {
                id: 'desc',
            },
            take: 15,
        });
    }
}
