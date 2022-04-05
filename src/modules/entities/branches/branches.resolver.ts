import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { Branch, BranchInput } from '../../common/dto/entities/branch.dto';

@Resolver(() => Branch)
@Injectable()
export class BranchesResolver {
  constructor(private branchesService: BranchesService) {}

  @Mutation(() => Branch)
  async createBranch(@Args('branchInput') input: BranchInput) {
    return this.branchesService.createPart(input);
  }
}
