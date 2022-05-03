import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class EmployeeBase {
    @Field()
    fullname: string;
}

@ObjectType('Employee')
export class Employee extends EmployeeBase {
    @Field({ nullable: false })
    id: number;
}
