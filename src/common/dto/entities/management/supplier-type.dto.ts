import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class SupplierTypesBase {
    @Field({ nullable: false })
    name: string;
}

@InputType('SupplierTypeInput')
export class SupplierTypeInput extends SupplierTypesBase {}

@InputType('SupplierTypeUpsertInput')
export class SupplierTypeUpsertInput extends SupplierTypesBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('SupplierType')
export class SupplierType extends SupplierTypesBase {
    @Field({ nullable: false })
    id: number;
}
