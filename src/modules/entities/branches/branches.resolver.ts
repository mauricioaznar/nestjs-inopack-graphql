import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { Branch, BranchInput } from '../../../common/dto/entities';

@Resolver(() => Branch)
@Injectable()
export class BranchesResolver {
    constructor(private branchesService: BranchesService) {}

    @Mutation(() => Branch)
    async createBranch(@Args('BranchInput') input: BranchInput) {
        return this.branchesService.createBranch(input);
    }

    @Query(() => [Branch])
    async getBranches() {
        return this.branchesService.getBranches();
    }
}
