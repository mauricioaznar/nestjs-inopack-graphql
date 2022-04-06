import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { MachinesService } from './machines.service';
import {
  Machine,
  MachineInput,
} from '../../../common/dto/entities/machine.dto';

@Resolver(() => Machine)
@Injectable()
export class MachinesResolver {
  constructor(private machinesService: MachinesService) {}

  @Mutation(() => Machine)
  async createMachine(@Args('MachineInput') input: MachineInput) {
    return this.machinesService.createMachine(input);
  }
}
