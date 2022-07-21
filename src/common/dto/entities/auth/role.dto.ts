import {
    Field,
    InputType,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';

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

export enum RoleId {
    SUPER = 1,
    ADMIN = 2,
    GUEST = 3,
    PRODUCTION = 4,
    SALES = 5,
}

registerEnumType(RoleId, {
    name: 'RoleId',
});
