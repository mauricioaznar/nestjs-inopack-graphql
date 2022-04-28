import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class PackingBase {
    @Field()
    name: string;
}

@ObjectType('Packing')
export class Packing extends PackingBase {
    @Field({ nullable: false })
    id: number;
}
