import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ProductMaterialBase {
    @Field()
    name: string;
}

@ObjectType('ProductMaterial')
export class ProductMaterial extends ProductMaterialBase {
    @Field({ nullable: false })
    id: number;
}
