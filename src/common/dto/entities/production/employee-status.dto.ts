import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class EmployeeStatusBase {
    @Field()
    name: string;
}

@ObjectType('EmployeeStatus')
export class EmployeeStatus extends EmployeeStatusBase {
    @Field({ nullable: false })
    id: number;
}
