import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { Role, RoleInput } from './role.dto';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class UserBase {
    @Field()
    email: string;

    @Field()
    first_name: string;

    @Field()
    last_name: string;
}

@InputType('loginInput')
export class LoginInput {
    @Field()
    @IsString()
    password: string;

    @Field()
    @IsString()
    email: string;
}

@InputType('CreateUserInput')
export class CreateUserInput extends UserBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;

    @Field()
    password: string;

    @Field(() => [RoleInput])
    roles: RoleInput[];
}

@InputType('UpdateUserInput')
export class UpdateUserInput extends UserBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => String, { nullable: true })
    password?: string | null;

    @Field(() => [RoleInput])
    roles: RoleInput[];
}

@ObjectType('User')
export class User extends UserBase {
    @Field({ nullable: false })
    id: number;

    @Field()
    fullname: string;

    static isUserSalesman({ roles }: { roles: Role[] }): boolean {
        return !!roles.find((role) => {
            return role.id === 5;
        });
    }

    static isUserSuper({ roles }: { roles: Role[] }) {
        return !!roles.find((role) => {
            return role.id === 1;
        });
    }

    static isUserAdmin({ roles }: { roles: Role[] }) {
        return !!roles.find((role) => {
            return role.id === 1 || role.id === 2;
        });
    }

    static isUserProduction({ roles }: { roles: Role[] }) {
        return !!roles.find((role) => {
            return role.id === 4;
        });
    }
}

@ObjectType('UserWithRoles')
export class UserWithRoles extends User {
    user_roles: {
        id: number;
        role_id?: number | null;
    }[];

    password?: string;
}

@ObjectType('AccessToken')
export class AccessToken {
    @Field({ nullable: false })
    accessToken: string;
}
