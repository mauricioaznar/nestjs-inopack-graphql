import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/modules/prisma/prisma.service';
import {
    GetPayrollPeriodsArgs,
    PayrollEntry,
    PayrollEntryInput,
    PayrollPeriod,
    PayrollPeriodInput,
} from '../../common/dto/entities';

@Injectable()
export class PayrollService {
    constructor(private prisma: PrismaService) {}

    async getPayrollPeriods({
        branch_id,
    }: GetPayrollPeriodsArgs): Promise<PayrollPeriod[]> {
        return this.prisma.payroll_periods.findMany({
            where: {
                active: 1,
                ...(branch_id ? { branch_id } : {}),
            },
            orderBy: [{ start_date: 'desc' }],
        });
    }

    async getPayrollPeriod(id: number): Promise<PayrollPeriod | null> {
        return this.prisma.payroll_periods.findFirst({
            where: { id, active: 1 },
        });
    }

    async upsertPayrollPeriod(input: PayrollPeriodInput): Promise<PayrollPeriod> {
        const startDate = input.start_date ? new Date(input.start_date) : null;
        const endDate = input.end_date ? new Date(input.end_date) : null;

        if (!startDate || isNaN(startDate.getTime()) || !endDate || isNaN(endDate.getTime())) {
            throw new Error('start_date and end_date are required and must be valid dates');
        }
        return this.prisma.payroll_periods.upsert({
            create: {
                start_date: startDate,
                end_date: endDate,
                week_number: input.week_number,
                branch_id: input.branch_id,
            },
            update: {
                start_date: startDate,
                end_date: endDate,
                week_number: input.week_number,
                branch_id: input.branch_id,
            },
            where: { id: input.id ?? 0 },
        });
    }

    async deletePayrollPeriod(id: number): Promise<boolean> {
        await this.prisma.payroll_periods.update({
            data: { active: -1 },
            where: { id },
        });
        return true;
    }

    async getPayrollEntries(payroll_period_id: number): Promise<PayrollEntry[]> {
        const rows = await this.prisma.payroll_entries.findMany({
            where: { payroll_period_id, active: 1 },
            orderBy: [{ id: 'asc' }],
        });
        return rows.map((r) => this.attachComputedFields(r));
    }

    async getPayrollEntry(id: number): Promise<PayrollEntry | null> {
        const row = await this.prisma.payroll_entries.findFirst({
            where: { id, active: 1 },
        });
        if (!row) return null;
        return this.attachComputedFields(row);
    }

    async upsertPayrollEntry(input: PayrollEntryInput): Promise<PayrollEntry> {
        const data = {
            payroll_period_id: input.payroll_period_id,
            employee_id: input.employee_id,
            estatus: input.estatus,
            area: input.area,
            puesto: input.puesto,
            control_bono_area: input.control_bono_area,
            control_deposito: input.control_deposito,
            sueldo: input.sueldo,
            jo: input.jo,
            ht: input.ht,
            he: input.he,
            retardos: input.retardos,
            faltas: input.faltas,
            vac: input.vac,
            dias_festivos: input.dias_festivos,
            infonavit: input.infonavit,
            fonacot: input.fonacot,
            descuento_prestamos: input.descuento_prestamos,
            otros_menos: input.otros_menos,
            entregas_especiales: input.entregas_especiales,
            viajes: input.viajes,
            bonos: input.bonos,
            otros_mas: input.otros_mas,
            bd: input.bd,
            observaciones: input.observaciones,
        };
        const row = await this.prisma.payroll_entries.upsert({
            create: data,
            update: data,
            where: { id: input.id ?? 0 },
        });
        return this.attachComputedFields(row);
    }

    async deletePayrollEntry(id: number): Promise<boolean> {
        await this.prisma.payroll_entries.update({
            data: { active: -1 },
            where: { id },
        });
        return true;
    }

    // ---------------------------------------------------------------------------
    // Calculated fields — all formulas derived from payroll-nomina-logic.md
    // ---------------------------------------------------------------------------

    private attachComputedFields(row: any): PayrollEntry {
        const { sueldo, jo, ht, he, dias_festivos, faltas, puesto, area, control_bono_area } = row;

        // HE — extra hours are now a manual input (row.he), no longer derived.

        // $HN — normal hours pay
        let hn: number;
        if (dias_festivos > 0) {
            const normal_hours = ht - he;
            hn = (normal_hours / jo) * sueldo;
        } else {
            const ratio = ht / jo;
            hn = ratio > 1 ? sueldo : ratio * sueldo;
        }

        // $HE — extra hours pay (2x)
        const daily_rate = sueldo / 7;
        const hourly_rate = daily_rate / (jo / 6);
        const he_pay = hourly_rate * he * 2;

        // $FEST — holiday pay
        const fest_pay = daily_rate * dias_festivos;

        // $VAC — vacation pay (125%)
        const vac_pay = daily_rate * row.vac * 1.25;

        // P & A — punctuality and attendance bonuses
        const bonus_pa = faltas > 0 || puesto.toUpperCase() === 'SUPERVISOR' ? 0 : hn * 0.18;
        const puntualidad = bonus_pa;
        const asistencia = bonus_pa;

        // BP — area bonus (Estrusion only)
        const bp =
            area.toLowerCase() === 'estrusion' && control_bono_area ? sueldo * 0.2 : 0;

        const total_plus =
            hn +
            he_pay +
            fest_pay +
            vac_pay +
            puntualidad +
            asistencia +
            bp +
            row.bd +
            row.entregas_especiales +
            row.viajes +
            row.bonos +
            row.otros_mas;

        const total_minus =
            row.infonavit + row.fonacot + row.descuento_prestamos + row.otros_menos;

        const total = total_plus - total_minus;

        return {
            ...row,
            hn,
            he_pay,
            fest_pay,
            vac_pay,
            puntualidad,
            asistencia,
            bp,
            total_plus,
            total_minus,
            total,
        };
    }
}
