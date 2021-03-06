import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { MachineCompatibilityUpsertInput } from './machine-compatibility.dto';

@InputType('MachinePartUpsertInput')
export class MachinePartUpsertInput {
    @Field({ nullable: true })
    id?: number;

    @Field()
    name: string;

    @Field(() => Int, { nullable: true })
    machine_section_id?: number | null;

    @Field(() => Int, { nullable: true })
    machine_id?: number | null;

    @Field(() => Int, { nullable: true })
    current_spare_id?: number | null;

    @Field(() => Int, { nullable: true })
    current_spare_required_quantity?: number | null;

    @Field(() => [MachineCompatibilityUpsertInput])
    machine_compatibilities: MachineCompatibilityUpsertInput[];
}

@ObjectType('MachinePart')
export class MachinePart {
    @Field({ nullable: false })
    id: number;

    @Field()
    name: string;

    @Field(() => Int, { nullable: true })
    machine_section_id?: number | null;

    @Field(() => Int, { nullable: true })
    machine_id?: number | null;

    @Field(() => Int, { nullable: true })
    current_spare_id?: number | null;

    @Field(() => Int, { nullable: true })
    current_spare_required_quantity?: number | null;
}
