import { ArgsType, Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class PayrollPeriodBase {
    @Field(() => Date, { nullable: false })
    start_date: Date;

    @Field(() => Date, { nullable: false })
    end_date: Date;

    @Field(() => Int, { nullable: false })
    week_number: number;

    @Field(() => Int, { nullable: true })
    branch_id: number | null;
}

@InputType('PayrollPeriodInput')
export class PayrollPeriodInput extends PayrollPeriodBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('PayrollPeriod')
export class PayrollPeriod extends PayrollPeriodBase {
    @Field(() => Int, { nullable: false })
    id: number;

    @Field(() => Date, { nullable: true })
    updated_at?: Date | null;
}

@ArgsType()
export class GetPayrollPeriodsArgs {
    @Field(() => Int, { nullable: true })
    branch_id: number | null;
}
