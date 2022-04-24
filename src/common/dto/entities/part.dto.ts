import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class PartBase {
    @Field()
    name: string;

    @Field()
    part_category_id: number;
}

@InputType('PartUpsertInput')
export class PartUpsertInput extends PartBase {
    @Field({ nullable: true })
    id?: number | null;
}

@ObjectType('Part')
export class Part extends PartBase {
    @Field({ nullable: false })
    id: number;
}
