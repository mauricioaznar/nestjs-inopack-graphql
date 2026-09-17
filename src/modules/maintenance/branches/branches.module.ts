import { Module } from '@nestjs/common';
import { BranchesResolver } from './branches.resolver';
import { BranchesService } from './branches.service';

@Module({
    providers: [BranchesResolver, BranchesService],
})
export class BranchesModule {}
