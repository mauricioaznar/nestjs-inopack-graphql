import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderProductionBase {
    @Field({ nullable: false })
    start_date: Date;

    @Field({ nullable: false })
    waste: number;
}

@InputType('OrderProductionInput')
export class OrderProductionInput extends OrderProductionBase {
    @Field({ nullable: true })
    id: number | null;
}

@ObjectType('OrderProduction')
export class OrderProduction extends OrderProductionBase {
    @Field({ nullable: false })
    id: number;
}
