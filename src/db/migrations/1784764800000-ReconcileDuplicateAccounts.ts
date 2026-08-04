import { MigrationInterface, QueryRunner } from 'typeorm';

type Usage = {
    expenses: number;
    order_requests: number;
    order_sales: number;
    transfers_from: number;
    transfers_to: number;
    contacts: number;
    products: number;
    resources: number;
};

type ExpectedAccount = {
    id: number;
    name: string;
    abbreviation: string;
    isSupplier: boolean;
    isClient: boolean;
    resourceId: number | null;
    usage: Usage;
};

type AccountRow = {
    id: number;
    active: number;
    name: string;
    abbreviation: string;
    is_supplier: number;
    is_client: number;
    is_own: number;
    requires_order_request: number;
    resource_id: number | null;
    monitor_supplier_expenses: number;
    client_credit_days: number;
    supplier_credit_days: number;
    client_require_credit_note: number;
    client_require_supplement: number;
    supplier_require_external_code: number;
    supplier_require_supplement: number;
    supplier_recurring_expenses: number;
    client_automatic_tax_calculation: number;
    exclude_from_accountability_export: number;
} & Usage;

const EXPECTED_ACCOUNTS: ExpectedAccount[] = [
    {
        id: 248,
        name: 'Promotores Mexicanos Electricos del Sur',
        abbreviation: 'Promessa',
        isSupplier: true,
        isClient: false,
        resourceId: 40,
        usage: usage(7, 0, 0, 0, 8, 0, 0, 0),
    },
    {
        id: 279,
        name: 'Promotores Mexicanos Electricos del Sur',
        abbreviation: '',
        isSupplier: true,
        isClient: false,
        resourceId: 40,
        usage: usage(0, 0, 0, 0, 0, 0, 0, 0),
    },
    {
        id: 288,
        name: 'Zeferino Rodriguez Luna',
        abbreviation: '',
        isSupplier: true,
        isClient: false,
        resourceId: 40,
        usage: usage(7, 0, 0, 0, 8, 0, 0, 2),
    },
    {
        id: 305,
        name: 'Zeferino Rodriguez Luna 2',
        abbreviation: '2',
        isSupplier: true,
        isClient: false,
        resourceId: 40,
        usage: usage(0, 0, 0, 0, 0, 0, 0, 0),
    },
    {
        id: 321,
        name: 'Manuel Amaya',
        abbreviation: 'Manuel Amaya',
        isSupplier: false,
        isClient: true,
        resourceId: null,
        usage: usage(0, 31, 32, 30, 0, 1, 8, 0),
    },
    {
        id: 322,
        name: 'David Escalante',
        abbreviation: 'Six David Escalante',
        isSupplier: false,
        isClient: false,
        resourceId: null,
        usage: usage(0, 0, 0, 0, 0, 1, 0, 0),
    },
    {
        id: 344,
        name: 'Manuel Amaya',
        abbreviation: '',
        isSupplier: true,
        isClient: false,
        resourceId: 40,
        usage: usage(2, 0, 0, 0, 2, 0, 0, 0),
    },
    {
        id: 365,
        name: 'Amilbert Avila',
        abbreviation: 'Amilbert Avila',
        isSupplier: false,
        isClient: true,
        resourceId: null,
        usage: usage(0, 5, 4, 4, 0, 1, 7, 0),
    },
    {
        id: 370,
        name: 'David Escalante',
        abbreviation: 'David Escalante Six',
        isSupplier: false,
        isClient: true,
        resourceId: null,
        usage: usage(0, 22, 23, 22, 0, 1, 12, 0),
    },
    {
        id: 390,
        name: 'Amilver',
        abbreviation: '',
        isSupplier: true,
        isClient: false,
        resourceId: 40,
        usage: usage(1, 0, 0, 0, 1, 0, 0, 0),
    },
    {
        id: 392,
        name: 'Amilvert Avila',
        abbreviation: 'Comision Belice',
        isSupplier: true,
        isClient: false,
        resourceId: 39,
        usage: usage(1, 0, 0, 0, 1, 0, 0, 0),
    },
];

const MERGES = [
    { sourceId: 390, targetId: 365 },
    { sourceId: 392, targetId: 365 },
    { sourceId: 305, targetId: 288 },
    { sourceId: 322, targetId: 370 },
    { sourceId: 344, targetId: 321 },
    { sourceId: 279, targetId: 248 },
];

function usage(
    expenses: number,
    order_requests: number,
    order_sales: number,
    transfers_from: number,
    transfers_to: number,
    contacts: number,
    products: number,
    resources: number,
): Usage {
    return {
        expenses,
        order_requests,
        order_sales,
        transfers_from,
        transfers_to,
        contacts,
        products,
        resources,
    };
}

function rowsFrom<T>(result: unknown): T[] {
    if (!Array.isArray(result)) return [];
    if (result.length === 2 && Array.isArray(result[0]))
        return result[0] as T[];
    return result as T[];
}

function affectedRows(result: any): number {
    const packet = Array.isArray(result) ? result[0] : result;
    return Number(packet?.affectedRows ?? 0);
}

export class ReconcileDuplicateAccounts1784764800000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        this.validateManifest();
        await this.assertColumnDoesNotExist(queryRunner);
        await this.assertReviewedSnapshot(queryRunner);

        await queryRunner.query(`
            ALTER TABLE accounts
            ADD COLUMN merged_into_account_id int UNSIGNED NULL,
            ADD INDEX accounts_merged_into_account_id_idx (merged_into_account_id),
            ADD CONSTRAINT accounts_merged_into_account_id_foreign
                FOREIGN KEY (merged_into_account_id) REFERENCES accounts(id)
                ON DELETE NO ACTION ON UPDATE NO ACTION;
        `);

        // Canonical client records retain their names, abbreviations, contacts,
        // and product catalogs. Only the reviewed supplier role/default is added.
        await this.updateCanonicalAccount(queryRunner, 365, true, true, 40);
        await this.updateCanonicalAccount(queryRunner, 321, true, true, 40);

        for (const mapping of MERGES) {
            const expectedSource = EXPECTED_ACCOUNTS.find(
                (account) => account.id === mapping.sourceId,
            );
            if (!expectedSource) {
                throw new Error(`Missing reviewed source ${mapping.sourceId}.`);
            }

            await this.moveReferences(
                queryRunner,
                mapping.sourceId,
                mapping.targetId,
                expectedSource.usage,
            );

            const result = await queryRunner.query(
                `UPDATE accounts
                 SET active = -1, merged_into_account_id = ?
                 WHERE id = ? AND active = 1 AND merged_into_account_id IS NULL;`,
                [mapping.targetId, mapping.sourceId],
            );
            if (affectedRows(result) !== 1) {
                throw new Error(
                    `Failed to retire source account ${mapping.sourceId}.`,
                );
            }
        }

        await this.assertFinalCounts(queryRunner);
        console.log(
            `Reconciled ${MERGES.length} duplicate account source(s) into 5 canonical accounts.`,
        );
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // Relationship reassignment is intentionally irreversible. Recovery is
        // a fresh restore of the reviewed dump, not an inferred split.
    }

    private validateManifest(): void {
        const sources = new Set<number>();
        const targets = new Set(MERGES.map((mapping) => mapping.targetId));

        for (const mapping of MERGES) {
            if (mapping.sourceId === mapping.targetId) {
                throw new Error(
                    `Account ${mapping.sourceId} cannot merge into itself.`,
                );
            }
            if (sources.has(mapping.sourceId)) {
                throw new Error(`Repeated merge source ${mapping.sourceId}.`);
            }
            if (targets.has(mapping.sourceId)) {
                throw new Error(
                    `Merge cycle involving account ${mapping.sourceId}.`,
                );
            }
            sources.add(mapping.sourceId);
        }
    }

    private async assertColumnDoesNotExist(
        queryRunner: QueryRunner,
    ): Promise<void> {
        const rows = rowsFrom<{ count: number }>(
            await queryRunner.query(`
                SELECT COUNT(*) AS count
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = 'accounts'
                  AND column_name = 'merged_into_account_id';
            `),
        );
        if (Number(rows[0]?.count ?? 0) !== 0) {
            throw new Error(
                'accounts.merged_into_account_id already exists; refusing a partial or repeated reconciliation.',
            );
        }
    }

    private async assertReviewedSnapshot(
        queryRunner: QueryRunner,
    ): Promise<void> {
        const ids = EXPECTED_ACCOUNTS.map((account) => account.id).join(',');
        const rows = rowsFrom<AccountRow>(
            await queryRunner.query(`
                SELECT
                    a.id, a.active, a.name, a.abbreviation,
                    a.is_supplier, a.is_client, a.is_own,
                    a.requires_order_request, a.resource_id,
                    a.monitor_supplier_expenses, a.client_credit_days,
                    a.supplier_credit_days, a.client_require_credit_note,
                    a.client_require_supplement,
                    a.supplier_require_external_code,
                    a.supplier_require_supplement,
                    a.supplier_recurring_expenses,
                    a.client_automatic_tax_calculation,
                    a.exclude_from_accountability_export,
                    (SELECT COUNT(*) FROM expenses e WHERE e.account_id = a.id) AS expenses,
                    (SELECT COUNT(*) FROM order_requests r WHERE r.account_id = a.id) AS order_requests,
                    (SELECT COUNT(*) FROM order_sales s WHERE s.account_id = a.id) AS order_sales,
                    (SELECT COUNT(*) FROM transfers t WHERE t.from_account_id = a.id) AS transfers_from,
                    (SELECT COUNT(*) FROM transfers t WHERE t.to_account_id = a.id) AS transfers_to,
                    (SELECT COUNT(*) FROM account_contacts c WHERE c.account_id = a.id) AS contacts,
                    (SELECT COUNT(*) FROM account_products p WHERE p.account_id = a.id) AS products,
                    (SELECT COUNT(*) FROM account_resources ar WHERE ar.account_id = a.id) AS resources
                FROM accounts a
                WHERE a.id IN (${ids})
                ORDER BY a.id;
            `),
        );

        if (rows.length !== EXPECTED_ACCOUNTS.length) {
            throw new Error(
                `Expected ${EXPECTED_ACCOUNTS.length} reviewed accounts, found ${rows.length}.`,
            );
        }

        for (const expected of EXPECTED_ACCOUNTS) {
            const actual = rows.find((row) => Number(row.id) === expected.id);
            if (!actual)
                throw new Error(`Reviewed account ${expected.id} is missing.`);

            const resourceId =
                actual.resource_id === null ? null : Number(actual.resource_id);
            const settingsMatch =
                Number(actual.active) === 1 &&
                actual.name === expected.name &&
                actual.abbreviation === expected.abbreviation &&
                Boolean(actual.is_supplier) === expected.isSupplier &&
                Boolean(actual.is_client) === expected.isClient &&
                Number(actual.is_own) === 0 &&
                Number(actual.requires_order_request) === 1 &&
                resourceId === expected.resourceId &&
                Number(actual.monitor_supplier_expenses) === 0 &&
                Number(actual.client_credit_days) === 0 &&
                Number(actual.supplier_credit_days) === 0 &&
                Number(actual.client_require_credit_note) === 0 &&
                Number(actual.client_require_supplement) === 1 &&
                Number(actual.supplier_require_external_code) === 0 &&
                Number(actual.supplier_require_supplement) === 0 &&
                Number(actual.supplier_recurring_expenses) === 0 &&
                Number(actual.client_automatic_tax_calculation) === 1 &&
                Number(actual.exclude_from_accountability_export) === 0;

            const usageMatches = Object.entries(expected.usage).every(
                ([key, value]) => Number(actual[key as keyof Usage]) === value,
            );

            if (!settingsMatch || !usageMatches) {
                throw new Error(
                    `Account ${expected.id} no longer matches the reviewed dump; rerun discovery and review before migrating.`,
                );
            }
        }
    }

    private async updateCanonicalAccount(
        queryRunner: QueryRunner,
        id: number,
        isSupplier: boolean,
        isClient: boolean,
        resourceId: number | null,
    ): Promise<void> {
        const result = await queryRunner.query(
            `UPDATE accounts
             SET is_supplier = ?, is_client = ?, resource_id = ?
             WHERE id = ? AND active = 1;`,
            [isSupplier, isClient, resourceId, id],
        );
        if (affectedRows(result) !== 1) {
            throw new Error(
                `Failed to apply canonical settings to account ${id}.`,
            );
        }
    }

    private async moveReferences(
        queryRunner: QueryRunner,
        sourceId: number,
        targetId: number,
        expected: Usage,
    ): Promise<void> {
        const moves = [
            ['expenses', 'account_id', expected.expenses],
            ['order_requests', 'account_id', expected.order_requests],
            ['order_sales', 'account_id', expected.order_sales],
            ['transfers', 'from_account_id', expected.transfers_from],
            ['transfers', 'to_account_id', expected.transfers_to],
        ] as const;

        for (const [table, column, expectedCount] of moves) {
            const result = await queryRunner.query(
                `UPDATE ${table} SET ${column} = ? WHERE ${column} = ?;`,
                [targetId, sourceId],
            );
            const moved = affectedRows(result);
            if (moved !== expectedCount) {
                throw new Error(
                    `Expected to move ${expectedCount} ${table}.${column} reference(s) from ${sourceId}, moved ${moved}.`,
                );
            }
        }
    }

    private async assertFinalCounts(queryRunner: QueryRunner): Promise<void> {
        const expectedTargets = new Map<number, Usage>();

        for (const mapping of MERGES) {
            const target = EXPECTED_ACCOUNTS.find(
                (account) => account.id === mapping.targetId,
            );
            const source = EXPECTED_ACCOUNTS.find(
                (account) => account.id === mapping.sourceId,
            );
            if (!target || !source)
                throw new Error('Incomplete reviewed manifest.');

            const current = expectedTargets.get(mapping.targetId) ?? {
                ...target.usage,
            };
            for (const key of [
                'expenses',
                'order_requests',
                'order_sales',
                'transfers_from',
                'transfers_to',
            ] as const) {
                current[key] += source.usage[key];
            }
            expectedTargets.set(mapping.targetId, current);
        }

        for (const mapping of MERGES) {
            const [source] = rowsFrom<AccountRow>(
                await queryRunner.query(`
                    SELECT
                        a.id,
                        (SELECT COUNT(*) FROM expenses e WHERE e.account_id = a.id) AS expenses,
                        (SELECT COUNT(*) FROM order_requests r WHERE r.account_id = a.id) AS order_requests,
                        (SELECT COUNT(*) FROM order_sales s WHERE s.account_id = a.id) AS order_sales,
                        (SELECT COUNT(*) FROM transfers t WHERE t.from_account_id = a.id) AS transfers_from,
                        (SELECT COUNT(*) FROM transfers t WHERE t.to_account_id = a.id) AS transfers_to
                    FROM accounts a WHERE a.id = ${mapping.sourceId};
                `),
            );
            const remaining =
                Number(source?.expenses ?? 0) +
                Number(source?.order_requests ?? 0) +
                Number(source?.order_sales ?? 0) +
                Number(source?.transfers_from ?? 0) +
                Number(source?.transfers_to ?? 0);
            if (remaining !== 0) {
                throw new Error(
                    `Source account ${mapping.sourceId} still has ${remaining} operational reference(s).`,
                );
            }
        }

        for (const [targetId, expected] of expectedTargets) {
            const [target] = rowsFrom<AccountRow>(
                await queryRunner.query(`
                    SELECT
                        a.id,
                        (SELECT COUNT(*) FROM expenses e WHERE e.account_id = a.id) AS expenses,
                        (SELECT COUNT(*) FROM order_requests r WHERE r.account_id = a.id) AS order_requests,
                        (SELECT COUNT(*) FROM order_sales s WHERE s.account_id = a.id) AS order_sales,
                        (SELECT COUNT(*) FROM transfers t WHERE t.from_account_id = a.id) AS transfers_from,
                        (SELECT COUNT(*) FROM transfers t WHERE t.to_account_id = a.id) AS transfers_to
                    FROM accounts a WHERE a.id = ${targetId};
                `),
            );
            const matches = [
                'expenses',
                'order_requests',
                'order_sales',
                'transfers_from',
                'transfers_to',
            ].every(
                (key) =>
                    Number(target?.[key as keyof Usage] ?? -1) ===
                    expected[key as keyof Usage],
            );
            if (!matches) {
                throw new Error(
                    `Canonical account ${targetId} counts do not reconcile after migration.`,
                );
            }
        }
    }
}
