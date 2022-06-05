import { Module } from '@nestjs/common';
import { BranchesResolver } from './branches.resolver';
import { BranchesService } from './branches.service';

@Module({
    providers: [BranchesResolver, BranchesService],
    exports: [BranchesResolver],
})
export class BranchesModule {}
