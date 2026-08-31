import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderQuotationStatusBase {
    @Field()
    name: string;
}

@ObjectType('OrderQuotationStatus')
export class OrderQuotationStatus extends OrderQuotationStatusBase {
    @Field({ nullable: false })
    id: number;
}
