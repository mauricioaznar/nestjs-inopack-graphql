import { Injectable } from '@nestjs/common';
import { Branch, BranchInput } from '../../../../common/dto/entities';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Injectable()
export class BranchesService {
    constructor(private prisma: PrismaService) {}

    async createBranch(branchInput: BranchInput): Promise<Branch> {
        return this.prisma.branches.create({
            data: {
                name: branchInput.name,
            },
        });
    }

    async getBranches(): Promise<Branch[]> {
        return this.prisma.branches.findMany();
    }
}
