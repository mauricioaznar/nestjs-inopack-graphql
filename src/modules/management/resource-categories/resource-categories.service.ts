import { Injectable } from '@nestjs/common';
import { ResourceCategory } from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class ResourceCategoriesService {
    constructor(private prisma: PrismaService) {}

    async getResourceCategories(): Promise<ResourceCategory[]> {
        return this.prisma.resource_categories.findMany();
    }
}
