import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsIn, IsString } from 'class-validator';

@ObjectType('UserConfig')
export class UserConfig {
    @Field(() => Int, { nullable: false })
    id: number;

    @Field(() => Int, { nullable: false })
    user_id: number;

    @Field(() => String, { nullable: false })
    color_mode: string;
}

@InputType('UpdateUserConfigInput')
export class UpdateUserConfigInput {
    @Field(() => String, { nullable: false })
    @IsString()
    @IsIn(['light', 'dark'])
    color_mode: string;
}
