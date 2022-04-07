import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsDate, IsDateString, IsISO8601 } from 'class-validator';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class MachineComponentCompatibilityBase {
  @Field({ nullable: true })
  compatible_part_id?: number | null;

  @Field({ nullable: true })
  machine_component_id?: number | null;
}

@InputType('MachineComponentCompatibilityInput')
export class MachineComponentCompatibilityInput extends MachineComponentCompatibilityBase {}

@ObjectType('MachineComponentCompatibility')
export class MachineComponentCompatibility extends MachineComponentCompatibilityBase {
  @Field({ nullable: false })
  id: number;
}
