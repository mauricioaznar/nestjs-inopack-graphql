import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ProductBase {
    @Field()
    description: string;
}

@InputType('ProductUpsertInput')
export class ProductUpsertInput extends ProductBase {
    @Field({ nullable: true })
    id?: number | null;
}

@ObjectType('Product')
export class Product extends ProductBase {
    @Field({ nullable: false })
    id: number;
}
