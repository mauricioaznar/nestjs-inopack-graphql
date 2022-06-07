import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class SpareCategoriesBase {
    @Field({ nullable: false })
    name: string;
}

@InputType('SpareCategoryInput')
export class SpareCategoryInput extends SpareCategoriesBase {}

@InputType('SpareCategoryUpsertInput')
export class SpareCategoryUpsertInput extends SpareCategoriesBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('SpareCategory')
export class SpareCategory extends SpareCategoriesBase {
    @Field({ nullable: false })
    id: number;
}
