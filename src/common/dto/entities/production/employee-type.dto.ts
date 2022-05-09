import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class EmployeeTypeBase {
    @Field()
    name: string;
}

@ObjectType('EmployeeType')
export class EmployeeType extends EmployeeTypeBase {
    @Field({ nullable: false })
    id: number;
}
