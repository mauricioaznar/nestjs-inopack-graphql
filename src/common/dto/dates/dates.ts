import { Field, ObjectType } from '@nestjs/graphql';
import { registerEnumType } from '@nestjs/graphql';

@ObjectType('Dates')
export class Dates {
    @Field({ description: 'Dates' })
    public year: number;
}

export enum DateGroup {
    day = 'day',
    month = 'month',
    year = 'year',
    week = 'week',
}

registerEnumType(DateGroup, {
    name: 'DateGroup',
});

@ObjectType('Month')
export class Month {
    @Field({ description: 'Dates' })
    public year: number;

    @Field({ description: 'Month' })
    public month: number;
}

@ObjectType('Day')
export class Day {
    @Field({ description: 'Dates' })
    public year: number;

    @Field({ description: 'Month' })
    public month: number;

    @Field({ description: 'Month' })
    public day: number;
}

export enum DateGroupBy {
    year = 'year',
    month = 'month',
    day = 'day',
}

registerEnumType(DateGroupBy, {
    name: 'DateGroupBy',
});
