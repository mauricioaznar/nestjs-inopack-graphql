import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConsumesInputToMachines1785873600000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE \`machines\`
        ADD COLUMN \`consumes_input\` tinyint(1) NOT NULL DEFAULT 1;
    `);

        // A database with no business data — the test/CI database rebuilt from
        // the `--no-data` schema snapshot (see db/README.md) — has no machines,
        // so the by-name seed below matches nothing and its assertion aborts the
        // run on zero affected rows, leaving the ALTER above half-applied. Apply
        // the column and stop before the seed when `machines` is empty. On a
        // populated database the assertion stays strict, so catalog divergence
        // is still caught.
        if (await this.isMachinesEmpty(queryRunner)) {
            console.log(
                '  machines is empty — applied column only, skipping the ' +
                    'packing-área seed (fresh/test database).',
            );
            return;
        }

        // The packing áreas pack bags that were already cut, so they consume no
        // bobina. Leaving them inside the material-balance identity injects a
        // permanent negative bias (production with no matching consumption), so
        // they are the reason this column exists.
        //
        // Seeded by name rather than by id because ids are not stable across the
        // local, test and production databases. The name match is a one-time
        // seed, not a runtime rule — the runtime rule reads this column, which is
        // the whole point. The assertion below is what makes the name match safe:
        // if the catalog ever diverges, this fails loudly instead of silently
        // flagging nothing.
        const result = await queryRunner.query(`
      UPDATE \`machines\`
         SET \`consumes_input\` = 0
       WHERE \`active\` = 1
         AND \`order_production_type_id\` = 1
         AND \`name\` LIKE 'Area de empacado%';
    `);

        // TypeORM's MySQL driver can return either the update packet directly
        // or [packet, fields]; both forms must validate the catalog seed.
        const updatePacket = Array.isArray(result) ? result[0] : result;
        const affected =
            updatePacket?.affectedRows ?? updatePacket?.changedRows ?? 0;
        if (affected !== 2) {
            throw new Error(
                `Expected to flag exactly 2 packing áreas as consumes_input = 0 ` +
                    `(Area de empacado (Bolsitas) and Area de empacado (Rollitos)), ` +
                    `but ${affected} rows were affected. Verify the machines catalog: ` +
                    `every corte y empaque machine that packs already-cut bags must ` +
                    `end up with consumes_input = 0, otherwise the material balance ` +
                    `page reports a permanent negative difference. The flag is ` +
                    `editable from the machine form, so it can also be corrected there.`,
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE \`machines\`
        DROP COLUMN \`consumes_input\`;
    `);
    }

    private async isMachinesEmpty(queryRunner: QueryRunner): Promise<boolean> {
        const result = await queryRunner.query(
            `SELECT COUNT(*) AS count FROM \`machines\`;`,
        );
        // The MySQL driver can return the rows array directly or [rows, fields].
        const rows =
            Array.isArray(result) && Array.isArray(result[0])
                ? result[0]
                : result;
        const count = Number((rows as { count?: number }[])[0]?.count ?? 0);
        return count === 0;
    }
}
