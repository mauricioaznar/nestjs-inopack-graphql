import { Field, InputType, ObjectType } from '@nestjs/graphql';

export type RoleTypes = 'super' | 'admin' | 'sales' | 'production' | 'guest';

@ObjectType('Role')
export class Role {
    @Field({ nullable: false })
    id: number;

    @Field()
    name: string;
}

@InputType('RoleInput')
export class RoleInput {
    @Field({ nullable: false })
    id: number;
}
