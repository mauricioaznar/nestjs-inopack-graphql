import mysql, { RowDataPacket } from 'mysql2/promise';
import {
    ACCOUNT_NAME_FUZZY_MIN_LENGTH,
    ACCOUNT_NAME_FUZZY_THRESHOLD,
    accountNameSimilarity,
    normalizeAccountName,
} from '../common/helpers/accounts/account-name-similarity';

type AccountRow = RowDataPacket & {
    id: number;
    active: number;
    name: string;
    abbreviation: string;
    created_at: Date | null;
    updated_at: Date | null;
    is_supplier: number;
    is_client: number;
    is_own: number;
    requires_order_request: number;
    monitor_supplier_expenses: number;
    expenses_count: number;
    order_requests_count: number;
    order_sales_count: number;
    transfers_from_count: number;
    transfers_to_count: number;
};

type AccountReport = {
    id: number;
    active: number;
    name: string;
    abbreviation: string;
    created_at: string | null;
    updated_at: string | null;
    roles: {
        is_supplier: boolean;
        is_client: boolean;
        is_own: boolean;
        requires_order_request: boolean;
        monitor_supplier_expenses: boolean;
    };
    normalized_name: string;
    usage: {
        expenses: number;
        order_requests: number;
        order_sales: number;
        transfers_from: number;
        transfers_to: number;
    };
};

type Candidate = {
    reason: 'normalized_exact' | 'fuzzy';
    similarity: number;
    accounts: [AccountReport, AccountReport];
};

function getFocusedName(): string | null {
    const nameIndex = process.argv.indexOf('--name');
    if (nameIndex === -1) return null;

    const name = process.argv[nameIndex + 1];
    if (!name) {
        throw new Error('Usage: npm run accounts:discover-duplicates -- --name "Account name"');
    }

    return name;
}

function toAccountReport(account: AccountRow): AccountReport {
    return {
        id: Number(account.id),
        active: Number(account.active),
        name: account.name,
        abbreviation: account.abbreviation,
        created_at: account.created_at ? account.created_at.toISOString() : null,
        updated_at: account.updated_at ? account.updated_at.toISOString() : null,
        roles: {
            is_supplier: Boolean(account.is_supplier),
            is_client: Boolean(account.is_client),
            is_own: Boolean(account.is_own),
            requires_order_request: Boolean(account.requires_order_request),
            monitor_supplier_expenses: Boolean(account.monitor_supplier_expenses),
        },
        normalized_name: normalizeAccountName(account.name),
        usage: {
            expenses: Number(account.expenses_count),
            order_requests: Number(account.order_requests_count),
            order_sales: Number(account.order_sales_count),
            transfers_from: Number(account.transfers_from_count),
            transfers_to: Number(account.transfers_to_count),
        },
    };
}

function getCandidates(accounts: AccountReport[], focusedName: string | null): Candidate[] {
    const focus = focusedName ? normalizeAccountName(focusedName) : null;
    const candidates: Candidate[] = [];

    for (let leftIndex = 0; leftIndex < accounts.length; leftIndex++) {
        for (let rightIndex = leftIndex + 1; rightIndex < accounts.length; rightIndex++) {
            const left = accounts[leftIndex];
            const right = accounts[rightIndex];

            if (focus && left.normalized_name !== focus && right.normalized_name !== focus) {
                continue;
            }

            const similarity = accountNameSimilarity(left.normalized_name, right.normalized_name);
            const exact = left.normalized_name === right.normalized_name;
            const fuzzy =
                !exact &&
                left.normalized_name.length >= ACCOUNT_NAME_FUZZY_MIN_LENGTH &&
                right.normalized_name.length >= ACCOUNT_NAME_FUZZY_MIN_LENGTH &&
                similarity >= ACCOUNT_NAME_FUZZY_THRESHOLD;

            if (!exact && !fuzzy) continue;

            candidates.push({
                reason: exact ? 'normalized_exact' : 'fuzzy',
                similarity: Number(similarity.toFixed(4)),
                accounts: [left, right],
            });
        }
    }

    return candidates.sort((left, right) =>
        left.reason.localeCompare(right.reason) ||
        left.accounts[0].normalized_name.localeCompare(right.accounts[0].normalized_name) ||
        left.accounts[0].id - right.accounts[0].id ||
        left.accounts[1].id - right.accounts[1].id,
    );
}

async function run(): Promise<void> {
    const url = process.env.MYSQL_URL;
    if (!url) throw new Error('MYSQL_URL is not set');

    const focusedName = getFocusedName();
    const connection = await mysql.createConnection(url);

    try {
        const [rows] = await connection.query<AccountRow[]>(`
            SELECT
                accounts.id,
                accounts.active,
                accounts.name,
                accounts.abbreviation,
                accounts.created_at,
                accounts.updated_at,
                accounts.is_supplier,
                accounts.is_client,
                accounts.is_own,
                accounts.requires_order_request,
                accounts.monitor_supplier_expenses,
                (SELECT COUNT(*) FROM expenses WHERE expenses.account_id = accounts.id) AS expenses_count,
                (SELECT COUNT(*) FROM order_requests WHERE order_requests.account_id = accounts.id) AS order_requests_count,
                (SELECT COUNT(*) FROM order_sales WHERE order_sales.account_id = accounts.id) AS order_sales_count,
                (SELECT COUNT(*) FROM transfers WHERE transfers.from_account_id = accounts.id) AS transfers_from_count,
                (SELECT COUNT(*) FROM transfers WHERE transfers.to_account_id = accounts.id) AS transfers_to_count
            FROM accounts
            ORDER BY accounts.id ASC
        `);

        const accounts = rows.map(toAccountReport);
        const candidates = getCandidates(accounts, focusedName);
        const exactCount = candidates.filter((candidate) => candidate.reason === 'normalized_exact').length;
        const fuzzyCount = candidates.length - exactCount;

        console.log(
            JSON.stringify(
                {
                    generated_at: new Date().toISOString(),
                    focused_name: focusedName,
                    account_count: accounts.length,
                    candidate_counts: {
                        normalized_exact: exactCount,
                        fuzzy: fuzzyCount,
                    },
                    candidates,
                },
                null,
                2,
            ),
        );
    } finally {
        await connection.end();
    }
}

run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
