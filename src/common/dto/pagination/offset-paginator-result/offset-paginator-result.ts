import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Type } from '@nestjs/common';

export function OffsetPaginatorResult<T>(ItemType: Type<T>): any {
    @ObjectType({ isAbstract: true })
    abstract class PageClass {
        @Field(() => [ItemType])
        docs: T[];

        @Field(() => Int)
        count: number;
    }

    return PageClass;
}
