import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class PartCategoriesBase {
    @Field({ nullable: false })
    name: string;
}

@InputType('PartCategoryInput')
export class PartCategoryInput extends PartCategoriesBase {}

@InputType('PartCategoryUpsertInput')
export class PartCategoryUpsertInput extends PartCategoriesBase {
    @Field({ nullable: true })
    id?: number | null;
}

@ObjectType('PartCategory')
export class PartCategory extends PartCategoriesBase {
    @Field({ nullable: false })
    id: number;
}
