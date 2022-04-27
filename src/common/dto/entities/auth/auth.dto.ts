import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class UserBase {
    @Field()
    email: string;
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

@InputType('userInput')
export class UserInput extends UserBase {
    @Field()
    password: string;
}

@ObjectType('User')
export class User extends UserBase {
    @Field({ nullable: false })
    id: number;
}

@ObjectType('UserWithRoles')
export class UserWithRoles extends User {
    user_roles: {
        id: number;
        role_id: number;
    }[];
}

@ObjectType('AccessToken')
export class AccessToken {
    @Field({ nullable: false })
    accessToken: string;
}
