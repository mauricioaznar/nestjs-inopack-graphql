import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class SpareBase {
    @Field()
    name: string;

    @Field(() => Int, { nullable: true })
    spare_category_id: number | null;
}

@InputType('SpareUpsertInput')
export class SpareUpsertInput extends SpareBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('Spare')
export class Spare extends SpareBase {
    @Field({ nullable: false })
    id: number;
}
