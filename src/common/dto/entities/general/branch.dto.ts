import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsDate } from 'class-validator';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class BranchBase {
    @Field()
    name: string;

    @Field({ nullable: true })
    @IsDate()
    created_at: Date | null;
}

@InputType('BranchInput')
export class BranchInput extends BranchBase {}

@ObjectType('Branch')
export class Branch extends BranchBase {
    @Field({ nullable: false })
    id: number;
}
