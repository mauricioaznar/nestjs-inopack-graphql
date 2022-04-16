import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { MachineCompatibilityUpsertInput } from './machine-compatibility.dto';

@InputType('MachineComponentInput')
export class MachineComponentInput {
  @Field()
  name: string;

  @Field()
  machine_section_id: number;
}

@InputType('MachineComponentUpsertInput')
export class MachineComponentUpsertInput {
  @Field({ nullable: true })
  id?: number;

  @Field()
  name: string;

  @Field()
  machine_section_id: number;

  @Field({ nullable: true })
  current_part_id?: number | null;

  @Field({ nullable: true })
  current_part_required_quantity?: number | null;

  @Field(() => [MachineCompatibilityUpsertInput])
  machine_compatibilities: MachineCompatibilityUpsertInput[];
}

@InputType('MachineComponentPartInput')
export class MachineComponentPartInput {
  @Field({ nullable: true })
  current_part_id?: number | null;

  @Field({ nullable: true })
  current_part_required_quantity?: number | null;
}

@ObjectType('MachineComponent')
export class MachineComponent {
  @Field({ nullable: false })
  id: number;

  @Field({ nullable: true })
  current_part_id?: number | null;

  @Field({ nullable: true })
  current_part_required_quantity?: number | null;

  @Field()
  name: string;

  @Field()
  machine_section_id: number;
}
