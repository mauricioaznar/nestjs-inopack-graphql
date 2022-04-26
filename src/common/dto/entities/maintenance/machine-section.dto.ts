import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class MachineSectionBase {
    @Field()
    name: string;

    @Field()
    machine_id: number;
}

@InputType('MachineSectionUpsertInput')
export class MachineSectionUpsertInput extends MachineSectionBase {
    @Field({ nullable: true })
    id?: number | null;
}

@ObjectType('MachineSection')
export class MachineSection extends MachineSectionBase {
    @Field({ nullable: false })
    id: number;
}