import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsDate, IsDateString, IsISO8601 } from 'class-validator';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class MachineBase {
  @Field()
  name: string;

  @Field()
  @IsDate()
  created_at: Date;
}

@InputType('MachineInput')
export class MachineInput extends MachineBase {}

@ObjectType('Machine')
export class Machine extends MachineBase {
  @Field({ nullable: false })
  id: number;
}
