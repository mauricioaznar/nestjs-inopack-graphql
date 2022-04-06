import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsDate } from 'class-validator';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class PartBase {
  @Field()
  name: string;

  @Field()
  @IsDate()
  created_at: Date;
}

@InputType('PartInput')
export class PartInput extends PartBase {}

@ObjectType('Part')
export class Part extends PartBase {
  @Field({ nullable: false })
  id: number;
}
