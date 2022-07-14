import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum ActivityEntityEnum {
    productType = 'productType',
    machine = 'machine',
}

registerEnumType(ActivityEntityEnum, {
    name: 'ActivityEntityEnum',
});

@ObjectType('Activity')
export class Activity {
    @Field(() => Date, { nullable: true })
    created_at: Date | null;
}
