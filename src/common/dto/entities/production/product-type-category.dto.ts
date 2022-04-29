import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ProductTypeCategoryBase {
    @Field()
    name: string;
}

@ObjectType('ProductTypeCategory')
export class ProductTypeCategory extends ProductTypeCategoryBase {
    @Field({ nullable: false })
    id: number;
}
