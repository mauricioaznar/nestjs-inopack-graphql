import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class MachineComponentBase {
  @Field()
  name: string;

  @Field()
  machine_section_id: number;
}

@InputType('MachineComponentInput')
export class MachineComponentInput extends MachineComponentBase {}

@ObjectType('MachineComponent')
export class MachineComponent extends MachineComponentBase {
  @Field({ nullable: false })
  id: number;
}
