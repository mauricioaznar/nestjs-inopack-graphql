import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class MachineSectionBase {
    @Field()
    name: string;

    @Field(() => Int, { nullable: true })
    machine_id?: number | null;
}

@InputType('MachineSectionUpsertInput')
export class MachineSectionUpsertInput extends MachineSectionBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('MachineSection')
export class MachineSection extends MachineSectionBase {
    @Field({ nullable: false })
    id: number;
}
