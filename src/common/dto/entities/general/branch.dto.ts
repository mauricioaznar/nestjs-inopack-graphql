import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class BranchBase {
    @Field()
    name: string;
}

@InputType('BranchInput')
export class BranchInput extends BranchBase {}

@ObjectType('Branch')
export class Branch extends BranchBase {
    @Field({ nullable: false })
    id: number;
}
