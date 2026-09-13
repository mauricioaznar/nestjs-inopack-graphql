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

    // Batched sibling of getCreatedBy/getUpdatedBy: one IN query for a whole
    // page's audit stamps. The `toOne` loader dedupes ids and maps each user back
    // to the rows that asked for it, so created_by + updated_by across a list
    // collapse into a single users query (see batch-loader `toOne`, shared name
    // 'audit.user'). Missing ids simply do not appear in the result.
    async getUsersByIds(ids: number[]): Promise<User[]> {
        if (ids.length === 0) return [];
        return this.prisma.users.findMany({
            where: { id: { in: ids } },
        });
    }
}
