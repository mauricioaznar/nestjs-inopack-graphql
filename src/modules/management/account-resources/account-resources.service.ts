import { Injectable } from '@nestjs/common';
import { AccountResource, Resource } from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class AccountResourcesService {
    constructor(private prisma: PrismaService) {}

    async getAccountResources({
        account_id,
    }: {
        account_id: number;
    }): Promise<AccountResource[]> {
        if (!account_id) return [];

        return this.prisma.account_resources.findMany({
            where: {
                account_id: account_id,
                active: 1,
            },
        });
    }

    async getResource({
        resource_id,
    }: {
        resource_id?: number | null;
    }): Promise<Resource | null> {
        if (!resource_id) return null;

        return this.prisma.resources.findFirst({
            where: { id: resource_id },
        });
    }
}
