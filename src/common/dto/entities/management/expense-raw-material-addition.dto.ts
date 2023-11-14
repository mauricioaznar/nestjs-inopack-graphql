import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ExpenseRawMaterialAdditionBase {
    @Field(() => Float, { nullable: false })
    amount: number;

    @Field(() => Int, { nullable: true })
    raw_material_addition_id?: number | null;
}

@InputType('ExpenseRawMaterialAdditionInput')
export class ExpenseRawMaterialAdditionInput extends ExpenseRawMaterialAdditionBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('ExpenseRawMaterialAddition')
export class ExpenseRawMaterialAddition extends ExpenseRawMaterialAdditionBase {
    @Field({ nullable: false })
    id: number;
}
