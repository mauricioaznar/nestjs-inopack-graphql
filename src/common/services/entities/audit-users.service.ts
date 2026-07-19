import { Injectable } from '@nestjs/common';
import { User } from '../../dto/entities';
import { PrismaService } from '../../modules/prisma/prisma.service';

/**
 * Resolves the created_by / updated_by audit stamps to their user.
 *
 * Same shape as OrderSaleService.getCreatedBy (the original implementation of
 * this lookup) — a plain findFirst per row. N+1 is accepted here, as it is
 * everywhere else in the codebase; there are no dataloaders.
 */
@Injectable()
export class AuditUsersService {
    constructor(private prisma: PrismaService) {}

    async getCreatedBy({
        created_by_id,
    }: {
        created_by_id?: number | null;
    }): Promise<User | null> {
        if (!created_by_id) return null;
        return this.prisma.users.findFirst({
            where: { id: created_by_id },
        });
    }

    async getUpdatedBy({
        updated_by_id,
    }: {
        updated_by_id?: number | null;
    }): Promise<User | null> {
        if (!updated_by_id) return null;
        return this.prisma.users.findFirst({
            where: { id: updated_by_id },
        });
    }
}
