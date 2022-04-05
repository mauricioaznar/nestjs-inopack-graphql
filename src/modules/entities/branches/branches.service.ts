import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { Branch, BranchInput } from '../../common/dto/entities/branch.dto';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async createPart(branchInput: BranchInput): Promise<Branch> {
    return this.prisma.branches.create({
      data: {
        name: branchInput.name,
        created_at: branchInput.created_at,
      },
    });
  }
}
