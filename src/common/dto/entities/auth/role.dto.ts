import {
    Field,
    InputType,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';

export type RoleTypes = 'super' | 'admin' | 'sales' | 'production' | 'guest';

@ObjectType('Role')
export class Role {
    @Field({ nullable: false })
    id: number;

    @Field()
    name: string;
}

@InputType('RoleInput')
export class RoleInput {
    @Field({ nullable: false })
    id: number;
}

export enum RoleId {
    SUPER = 1, // DB: "Super"
    ADMIN = 2, // DB: "General"
    GUEST = 3, // DB: "Asistente General"
    PRODUCTION = 4, // DB: "Produccion"
    SALES = 5, // DB: "Ventas"
    PRODUCTION_ASSISTANT = 6, // DB: "Asistente Produccion"
    SALES_ASSISTANT = 7, // DB: "Asistente Ventas"
    EXPENSES = 8, // DB: "Gastos"
    EXPENSES_ASSISTANT = 9, // DB: "Asistente Gastos"
    HUMAN_RESOURCES = 10, // DB: "Recursos Humanos"
    HUMAN_RESOURCES_ASSISTANT = 11, // DB: "Asistente Recursos Humanos"
}

registerEnumType(RoleId, {
    name: 'RoleId',
});
