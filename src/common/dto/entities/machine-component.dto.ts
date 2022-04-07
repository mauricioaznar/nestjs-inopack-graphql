import { Field, InputType, ObjectType } from '@nestjs/graphql';

@InputType('MachineComponentInput')
export class MachineComponentInput {
  @Field()
  name: string;

  @Field()
  machine_section_id: number;
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
