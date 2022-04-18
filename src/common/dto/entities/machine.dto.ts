import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class MachineBase {
  @Field()
  name: string;
}

@InputType('MachineInput')
export class MachineInput extends MachineBase {}

@InputType('MachineUpsertInput')
export class MachineUpsertInput extends MachineBase {
  @Field({ nullable: true })
  id?: number | null;
}

@ObjectType('Machine')
export class Machine extends MachineBase {
  @Field({ nullable: false })
  id: number;
}
