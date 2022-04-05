import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsDate, IsDateString, IsISO8601 } from 'class-validator';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class BranchBase {
  @Field()
  name: string;

  @Field()
  @IsDate()
  created_at: Date;
}

@InputType('branchInput')
export class BranchInput extends BranchBase {}

@ObjectType('Branch')
export class Branch extends BranchBase {
  @Field({ nullable: false })
  id: number;
}
