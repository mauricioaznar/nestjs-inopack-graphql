import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class RawMaterialAdditionItemBase {
    @Field(() => Float, { nullable: false })
    amount: number;
}

@InputType('RawMaterialAdditionItemInput')
export class RawMaterialAdditionItemInput extends RawMaterialAdditionItemBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('RawMaterialAdditionItem')
export class RawMaterialAdditionItem extends RawMaterialAdditionItemBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    raw_material_addition_id: number | null;
}
