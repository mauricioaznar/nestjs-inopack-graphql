import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class MachineCompatibilityBase {
  @Field({ nullable: true })
  part_id?: number | null;
}

@InputType('MachineCompatibilityUpsertInput')
export class MachineCompatibilityUpsertInput extends MachineCompatibilityBase {}

@InputType('MachineCompatibilityInput')
export class MachineCompatibilityInput extends MachineCompatibilityBase {
  @Field({ nullable: true })
  machine_component_id?: number | null;
}

@ObjectType('MachineCompatibility')
export class MachineCompatibility extends MachineCompatibilityBase {
  @Field({ nullable: false })
  id: number;

  @Field({ nullable: true })
  machine_component_id?: number | null;
}
