import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class PayrollEntryBase {
    @Field(() => Int, { nullable: false })
    payroll_period_id: number;

    @Field(() => Int, { nullable: false })
    employee_id: number;

    @Field(() => String, { nullable: false })
    estatus: string;

    @Field(() => Boolean, { nullable: false })
    control_bono_area: boolean;

    @Field(() => Boolean, { nullable: false })
    control_deposito: boolean;

    @Field(() => Float, { nullable: false })
    sueldo: number;

    @Field(() => Float, { nullable: false })
    jo: number;

    @Field(() => Float, { nullable: false })
    ht: number;

    @Field(() => Float, { nullable: false })
    he: number;

    @Field(() => Boolean, { nullable: false })
    he_override: boolean;

    @Field(() => Int, { nullable: false })
    retardos: number;

    @Field(() => Int, { nullable: false })
    faltas: number;

    @Field(() => Float, { nullable: false })
    vac: number;

    @Field(() => Float, { nullable: false })
    dias_festivos: number;

    @Field(() => Float, { nullable: false })
    infonavit: number;

    @Field(() => Float, { nullable: false })
    fonacot: number;

    @Field(() => Float, { nullable: false })
    descuento_prestamos: number;

    @Field(() => Float, { nullable: false })
    otros_menos: number;

    @Field(() => Float, { nullable: false })
    entregas_especiales: number;

    @Field(() => Float, { nullable: false })
    viajes: number;

    @Field(() => Float, { nullable: false })
    bonos: number;

    @Field(() => Float, { nullable: false })
    otros_mas: number;

    @Field(() => Float, { nullable: false })
    bd: number;

    @Field(() => String, { nullable: false })
    observaciones: string;
}

@InputType('PayrollEntryInput')
export class PayrollEntryInput extends PayrollEntryBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('PayrollEntry')
export class PayrollEntry extends PayrollEntryBase {
    @Field(() => Int, { nullable: false })
    id: number;

    @Field(() => Date, { nullable: true })
    updated_at?: Date | null;

    // --- computed fields (resolved at the GraphQL layer) ---

    // area is the employee's category name; is_leader + employee_name come from the employee.
    @Field(() => String, { nullable: false })
    area: string;

    @Field(() => String, { nullable: false })
    employee_name: string;

    @Field(() => Int, { nullable: false })
    is_leader: number;

    @Field(() => Float, { nullable: false })
    he_effective: number;

    @Field(() => Float, { nullable: false })
    hn: number;

    @Field(() => Float, { nullable: false })
    he_pay: number;

    @Field(() => Float, { nullable: false })
    fest_pay: number;

    @Field(() => Float, { nullable: false })
    vac_pay: number;

    @Field(() => Float, { nullable: false })
    prima_vac: number;

    @Field(() => Float, { nullable: false })
    puntualidad: number;

    @Field(() => Float, { nullable: false })
    asistencia: number;

    @Field(() => Float, { nullable: false })
    bp: number;

    @Field(() => Float, { nullable: false })
    total_plus: number;

    @Field(() => Float, { nullable: false })
    total_minus: number;

    @Field(() => Float, { nullable: false })
    total: number;
}
