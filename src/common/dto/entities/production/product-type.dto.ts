import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ProductTypeBase {
    @Field()
    name: string;
}

@ObjectType('ProductType')
export class ProductType extends ProductTypeBase {
    @Field({ nullable: false })
    id: number;
}
