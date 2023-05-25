import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ResourceCategoriesBase {
    @Field({ nullable: false })
    name: string;
}

@InputType('ResourceCategoryInput')
export class ResourceCategoryInput extends ResourceCategoriesBase {}

@InputType('ResourceCategoryUpsertInput')
export class ResourceCategoryUpsertInput extends ResourceCategoriesBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('ResourceCategory')
export class ResourceCategory extends ResourceCategoriesBase {
    @Field({ nullable: false })
    id: number;
}
