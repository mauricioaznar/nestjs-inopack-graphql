import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class MachineCompatibilityBase {
  @Field({ nullable: true })
  part_id?: number | null;

  @Field({ nullable: true })
  machine_component_id?: number | null;
}

@InputType('MachineCompatibilityInput')
export class MachineCompatibilityInput extends MachineCompatibilityBase {}

@ObjectType('MachineCompatibility')
export class MachineCompatibility extends MachineCompatibilityBase {
  @Field({ nullable: false })
  id: number;
}
