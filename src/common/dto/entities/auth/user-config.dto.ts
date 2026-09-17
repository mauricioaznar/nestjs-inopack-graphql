import { Field, Int, ObjectType } from '@nestjs/graphql';

// Per-user settings. Currently only dark_mode (lifted out of localStorage);
// created_at/updated_at exist on the row but are not exposed to GraphQL.
@ObjectType('UserConfig')
export class UserConfig {
    @Field(() => Int)
    id: number;

    @Field(() => Int)
    user_id: number;

    @Field(() => Boolean)
    dark_mode: boolean;
}
