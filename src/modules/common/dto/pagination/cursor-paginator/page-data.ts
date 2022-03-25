import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export default class PageData {
  @Field({ nullable: true })
  public count: number;

  @Field({ nullable: true })
  public limit: number;

  @Field({ nullable: true })
  public offset: number;
}
