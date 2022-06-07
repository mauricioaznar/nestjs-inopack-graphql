import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

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
    @Field()
    password: string;
}

@InputType('UpdateUserInput')
export class UpdateUserInput extends UserBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => String, { nullable: true })
    password?: string | null;
}

@ObjectType('User')
export class User extends UserBase {
    @Field({ nullable: false })
    id: number;

    @Field()
    fullname: string;
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
