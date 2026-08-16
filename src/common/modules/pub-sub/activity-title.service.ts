import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';
import { formatFloat } from '../../helpers';

// Builds the `title` stored on every activity row: a short, frozen IDENTIFIER
// for the record the activity is about — "1042 (F103) · ACME", not a sentence.
//
// Why this file exists at all, given the snapshots: `old_data`/`new_data` answer
// WHAT changed, but the feed never loads them (they are whole rows with
// children, and `getActivity` is gated to the global roles). The title answers
// WHICH RECORD in one column, for every role, for one varchar. It is also the
// only thing that still identifies a record once it has been hard-deleted.
//
// Every title in the system is written here, on purpose. The previous
// per-call-site strings drifted into two different kinds of thing — some
// identified the record, some just restated the primary key already held in
// `entity_id` — precisely because they were fourteen separate literals.
//
// The activity feed renders `entity_name` in its own column, so a title carries
// NO entity prefix: "1042 (F103) · ACME", never "Venta: 1042 (F103) · ACME".
//
// See docs/features/ongoing/feature-activities-audit.md §9.1.

const MAX_TITLE_LENGTH = 255;
const SEPARATOR = ' · ';

/** Local date, formatted for a Mexican reader. */
function formatTitleDate(date?: Date | string | null): string {
    if (!date) return '';
    return dayjs(date).utc().format('DD/MM/YYYY');
}

function formatAmount(amount?: number | null): string {
    if (amount === null || amount === undefined) return '';
    return `$${formatFloat(amount)}`;
}

/**
 * Joins the segments that are actually present and guarantees a non-empty
 * result: a record with every identifying field blank still gets `#123` rather
 * than an empty cell or a dangling separator.
 */
function buildTitle(id: number, ...segments: (string | null | undefined)[]): string {
    const present: string[] = [];
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (segment !== null && segment !== undefined && segment !== '') {
            present.push(segment);
        }
    }

    const title = present.length > 0 ? present.join(SEPARATOR) : `#${id}`;

    return title.length > MAX_TITLE_LENGTH
        ? title.slice(0, MAX_TITLE_LENGTH)
        : title;
}

@Injectable()
export class ActivityTitleService {
    constructor(private prisma: PrismaService) {}

    // ── Lookups ──────────────────────────────────────────────────────────────
    // Six of the fourteen entities identify themselves partly by a counterpart
    // that lives in another table (the client on a sale, the accounts on a
    // transfer). Resolving it costs an extra query per activity WRITE, which is
    // rare and already inside a mutation — and the counterpart name is exactly
    // what makes a feed row recognisable.

    private async getAccountName(
        accountId?: number | null,
    ): Promise<string> {
        if (!accountId) return '';
        const account = await this.prisma.accounts.findFirst({
            where: { id: accountId },
            select: { name: true, abbreviation: true },
        });
        if (!account) return '';
        // Abbreviation first: it is what keeps the title short enough to scan.
        return account.abbreviation || account.name || '';
    }

    private async getResourceName(resourceId?: number | null): Promise<string> {
        if (!resourceId) return '';
        const resource = await this.prisma.resources.findFirst({
            where: { id: resourceId },
            select: { name: true },
        });
        return resource?.name || '';
    }

    private async getExpenseCode(expenseId?: number | null): Promise<string> {
        if (!expenseId) return '';
        const expense = await this.prisma.expenses.findFirst({
            where: { id: expenseId },
            select: { external_code: true, internal_code: true },
        });
        if (!expense) return '';
        return this.expenseCode(expense);
    }

    private async getOrderSaleCode(
        orderSaleId?: number | null,
    ): Promise<string> {
        if (!orderSaleId) return '';
        const orderSale = await this.prisma.order_sales.findFirst({
            where: { id: orderSaleId },
            select: { order_code: true, invoice_code: true },
        });
        if (!orderSale) return '';
        return orderSale.invoice_code
            ? `${orderSale.order_code} (F${orderSale.invoice_code})`
            : `${orderSale.order_code}`;
    }

    // `external_code` defaults to '' rather than null, so `||` and not `??`.
    private expenseCode(expense: {
        external_code?: string | null;
        internal_code?: number | null;
    }): string {
        return (
            expense.external_code ||
            (expense.internal_code ? `Interno ${expense.internal_code}` : '')
        );
    }

    // ── Titles ───────────────────────────────────────────────────────────────

    /** `1042 (F103) · ACME` */
    async orderSale(orderSale: {
        id: number;
        order_code: number;
        invoice_code: number;
        account_id?: number | null;
    }): Promise<string> {
        const code = orderSale.invoice_code
            ? `${orderSale.order_code} (F${orderSale.invoice_code})`
            : `${orderSale.order_code}`;

        return buildTitle(
            orderSale.id,
            code,
            await this.getAccountName(orderSale.account_id),
        );
    }

    /** `1042 (F103) · Factura firmada` */
    async orderSaleComment(comment: {
        id: number;
        order_sale_id?: number | null;
        pending_task_comment?: string | null;
    }): Promise<string> {
        return buildTitle(
            comment.id,
            await this.getOrderSaleCode(comment.order_sale_id),
            comment.pending_task_comment,
        );
    }

    /** `1042 · ACME` */
    async orderRequest(orderRequest: {
        id: number;
        order_code: number;
        account_id?: number | null;
    }): Promise<string> {
        return buildTitle(
            orderRequest.id,
            `${orderRequest.order_code}`,
            await this.getAccountName(orderRequest.account_id),
        );
    }

    /** `1042 · ACME` */
    async orderQuotation(orderQuotation: {
        id: number;
        order_code: number;
        account_id?: number | null;
    }): Promise<string> {
        return buildTitle(
            orderQuotation.id,
            `${orderQuotation.order_code}`,
            await this.getAccountName(orderQuotation.account_id),
        );
    }

    /** `15/07/2026 · Turno 2` */
    orderProduction(orderProduction: {
        id: number;
        start_date?: Date | string | null;
        shift?: number | null;
    }): string {
        return buildTitle(
            orderProduction.id,
            formatTitleDate(orderProduction.start_date),
            orderProduction.shift ? `Turno ${orderProduction.shift}` : '',
        );
    }

    /** `15/07/2026 · Merma` */
    async orderAdjustment(orderAdjustment: {
        id: number;
        date?: Date | string | null;
        order_adjustment_type_id?: number | null;
    }): Promise<string> {
        let typeName = '';
        if (orderAdjustment.order_adjustment_type_id) {
            const type = await this.prisma.order_adjustment_type.findFirst({
                where: { id: orderAdjustment.order_adjustment_type_id },
                select: { name: true },
            });
            typeName = type?.name || '';
        }

        return buildTitle(
            orderAdjustment.id,
            formatTitleDate(orderAdjustment.date),
            typeName,
        );
    }

    /** `15/07/2026 · Turno 2` */
    productionPlan(productionPlan: {
        id: number;
        date?: Date | string | null;
        shift?: number | null;
    }): string {
        return buildTitle(
            productionPlan.id,
            formatTitleDate(productionPlan.date),
            productionPlan.shift ? `Turno ${productionPlan.shift}` : '',
        );
    }

    /** `A-1234 · Bolsa 40x60` */
    product(product: {
        id: number;
        code?: string | null;
        external_description?: string | null;
    }): string {
        return buildTitle(product.id, product.code, product.external_description);
    }

    /** `Polietileno alta densidad` */
    resource(resource: { id: number; name?: string | null }): string {
        return buildTitle(resource.id, resource.name);
    }

    /** `Extrusora 3` */
    machine(machine: { id: number; name?: string | null }): string {
        return buildTitle(machine.id, machine.name);
    }

    /** `Juan Pérez` */
    employee(employee: { id: number; fullname?: string | null }): string {
        return buildTitle(employee.id, employee.fullname);
    }

    /**
     * `Juan Pérez` — name only.
     *
     * The email is deliberately NOT included: the activities page is
     * GENERAL_VIEW, so anything in a title is readable by every authenticated
     * user. The previous description embedded it, which made the feed a staff
     * email directory.
     */
    user(user: { id: number; fullname?: string | null }): string {
        return buildTitle(user.id, user.fullname);
    }

    /** `ACME · Acme Empaques SA` */
    account(account: {
        id: number;
        abbreviation?: string | null;
        name?: string | null;
    }): string {
        return buildTitle(account.id, account.abbreviation, account.name);
    }

    // NOTE: no `accountProduct` builder. `ActivityEntityName.ACCOUNT_PRODUCT`
    // exists but nothing ever publishes it (§6.6, "Dead entries found"), so a
    // title for it would be code that can never run.

    /** `EXT-8891 · Proveedor` */
    async expense(expense: {
        id: number;
        external_code?: string | null;
        internal_code?: number | null;
        account_id?: number | null;
    }): Promise<string> {
        return buildTitle(
            expense.id,
            this.expenseCode(expense),
            await this.getAccountName(expense.account_id),
        );
    }

    /** `EXT-8891 · Comprobante de pago` */
    async expenseComment(comment: {
        id: number;
        expense_id?: number | null;
        pending_task_comment?: string | null;
    }): Promise<string> {
        return buildTitle(
            comment.id,
            await this.getExpenseCode(comment.expense_id),
            comment.pending_task_comment,
        );
    }

    /** `EXT-8891 · Polietileno` */
    async expenseResource(expenseResource: {
        id: number;
        expense_id?: number | null;
        resource_id?: number | null;
    }): Promise<string> {
        return buildTitle(
            expenseResource.id,
            await this.getExpenseCode(expenseResource.expense_id),
            await this.getResourceName(expenseResource.resource_id),
        );
    }

    /** `$12,500.00 · Bancomer → ACME` */
    async transfer(transfer: {
        id: number;
        amount?: number | null;
        from_account_id?: number | null;
        to_account_id?: number | null;
    }): Promise<string> {
        const from = await this.getAccountName(transfer.from_account_id);
        const to = await this.getAccountName(transfer.to_account_id);

        // One side can be missing (an adjustment has no counterpart), so the
        // arrow is only drawn when there are two ends to connect.
        const accounts =
            from && to ? `${from} → ${to}` : from || to || '';

        return buildTitle(transfer.id, formatAmount(transfer.amount), accounts);
    }
}
