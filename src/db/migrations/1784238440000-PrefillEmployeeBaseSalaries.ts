import { MigrationInterface, QueryRunner } from 'typeorm';

// Data-only backfill of employees.base_salary + employees.hours_should_work
// from the BACA "Semana 27 2026" nómina sheet (col G = SUELDO, col H = J O =
// 48/52.5). Lives in its OWN migration (not folded into CreatePayroll) because
// the runner records migrations by class name and skips already-run ones — the
// original CreatePayroll already executed in production, so editing it there
// would be inert. This new class runs wherever it hasn't yet.
//
// MATCHING IS BEST-EFFORT (decided with the user): the DB fullname is
// `first_name + ' ' + last_name`, whose word order may not match the sheet's
// "APELLIDO APELLIDO NOMBRE", so instead of an exact compare we require every
// name token to be present (AND of LIKEs) — order-independent, maximizing hits.
// Trade-off: a name whose tokens are a subset of another employee's could
// over-match; unmatched or mis-matched rows are corrected by hand afterward.
// Reconciliation query to eyeball the result after running:
//   SELECT id, fullname, base_salary, hours_should_work FROM employees
//   WHERE active = 1 ORDER BY fullname;
export class PrefillEmployeeBaseSalaries1784238440000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        const rows: Array<{ name: string; salary: number; hours: number }> = [
            { name: 'ABAN UICAB ANGEL EDUARDO', salary: 2135, hours: 48 },
            { name: 'ABAN UICAB JESUS DANIEL', salary: 2135, hours: 48 },
            { name: 'AKE ITZA IRMA MARIA ISABEL', salary: 1750, hours: 48 },
            { name: 'ALVAREZ MENDEZ JUAN NOEL', salary: 1970, hours: 48 },
            { name: 'BASTO PECH GABRIEL ALBERTO', salary: 1935, hours: 48 },
            { name: 'CAAMAL GONZALEZ INGRID AIDDE', salary: 2025, hours: 48 },
            { name: 'CAMPOS CANCHE SERGIO ISRAEL', salary: 2190, hours: 52.5 },
            { name: 'CAN MAZA ROSANA GUADALUPE', salary: 1750, hours: 48 },
            { name: 'CANUL CAUICH MAYRA LUBIANA', salary: 1750, hours: 52.5 },
            { name: 'CANUL CHAN DAMIAN ISRAEL', salary: 2850, hours: 52.5 },
            { name: 'CAUICH BAAK JOSEPH ALEJANDRO', salary: 1970, hours: 48 },
            { name: 'CAUICH CIAU MAGDALENA AZULEMY', salary: 1750, hours: 48 },
            { name: 'CETZAL CHI RENE VALENTIN', salary: 1750, hours: 48 },
            { name: 'CHIM LAURO', salary: 2135, hours: 52.5 },
            { name: 'COB DIAZ SERGIO GABRIEL', salary: 1750, hours: 48 },
            { name: 'GOMEZ CAAMAL MARIA EMILIA', salary: 1750, hours: 48 },
            { name: 'HU AKE ANAHI DEL ROCIO', salary: 1750, hours: 48 },
            { name: 'ITZA TZUC NICANDRO ISMAEL', salary: 2135, hours: 48 },
            { name: 'NOH CANCHE JUAN ANTONIO', salary: 2190, hours: 52.5 },
            { name: 'ORAMAS FLORES NORBERTO EMANUEL', salary: 1750, hours: 48 },
            { name: 'OSORIO FERRERA URIEL ABRAHAM', salary: 1750, hours: 48 },
            { name: 'PECH CETINA MARTHA ORQUIDEA', salary: 1750, hours: 48 },
            { name: 'PECH MARTIN MARA DE LOS ANGELES', salary: 1750, hours: 48 },
            { name: 'PECH POOL JOSE RAMIRO', salary: 2520, hours: 52.5 },
            { name: 'PUC PECH JOSE ARMANDO', salary: 1750, hours: 48 },
            { name: 'RAMIREZ CHUC AUREMI SARAI', salary: 1750, hours: 48 },
            { name: 'SOLIS BORGES JUAN DAMASO', salary: 1750, hours: 48 },
            { name: 'SOLIS PEET JUAN ALBERTO', salary: 1750, hours: 48 },
            { name: 'TEC EUAN JOSE GERARDO', salary: 1970, hours: 48 },
            { name: 'TZUC AKE MARIA JOSEFINA', salary: 1750, hours: 48 },
            { name: 'TZUC BAAK NERY ISMAEL', salary: 1750, hours: 48 },
            { name: 'TZUC JOSE REYES', salary: 1750, hours: 48 },
            { name: 'VERA HUA RAUL ALEJANDRO', salary: 1750, hours: 48 },
            { name: 'YAM PECH LUIS ANTONIO', salary: 1750, hours: 48 },
            { name: 'YAM PECH MAURICIO ENRIQUE', salary: 1970, hours: 48 },
            { name: 'YAM TUN LORENZO JAVIER', salary: 3510, hours: 52.5 },
            { name: 'BALAM CAAMAL JOSEPH KENNEDRY', salary: 1750, hours: 48 },
            { name: 'MORENO UC BRAYAM LEONEL', salary: 1750, hours: 48 },
            { name: 'RAMIREZ MAY SELMY BEATRIZ', salary: 1750, hours: 48 },
            { name: 'TUN UC JOSE SANTOS', salary: 1750, hours: 48 },
        ];

        for (const r of rows) {
            const tokens = r.name.trim().split(/\s+/);
            const where = tokens.map(() => 'UPPER(`fullname`) LIKE ?').join(' AND ');
            const params: (string | number)[] = [
                r.salary,
                r.hours,
                ...tokens.map((t) => `%${t.toUpperCase()}%`),
            ];
            await queryRunner.query(
                'UPDATE `employees` SET `base_salary` = ?, `hours_should_work` = ? ' +
                    `WHERE \`active\` = 1 AND ${where}`,
                params,
            );
        }
    }

    // Pure data backfill — nothing structural to reverse, and the prior values
    // aren't recoverable, so down() is intentionally a no-op.
    public async down(): Promise<void> {
        return;
    }
}
