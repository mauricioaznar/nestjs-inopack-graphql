import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class MachineCompatibilityBase {
    @Field({ nullable: true })
    spare_id?: number | null;
}

@InputType('MachineCompatibilityUpsertInput')
export class MachineCompatibilityUpsertInput extends MachineCompatibilityBase {}

@ObjectType('MachineCompatibility')
export class MachineCompatibility extends MachineCompatibilityBase {
    @Field({ nullable: false })
    id: number;

    @Field({ nullable: true })
    machine_part_id?: number | null;
}
