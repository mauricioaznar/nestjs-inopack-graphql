import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class UserBase {
  @Field()
  username: string;
}

@InputType('loginInput')
export class LoginInput {
  @Field()
  @IsString()
  password: string;

  @Field()
  @IsString()
  username: string;
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

@ObjectType('AccessToken')
export class AccessToken {
  @Field({ nullable: false })
  accessToken: string;
}
