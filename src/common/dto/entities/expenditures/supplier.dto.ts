import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class SupplierBase {
    @Field()
    name: string;
}

@InputType('SupplierUpsertInput')
export class SupplierUpsertInput extends SupplierBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('Supplier')
export class Supplier extends SupplierBase {
    @Field({ nullable: false })
    id: number;
}
