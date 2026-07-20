/**
 * compute-product-name.ts
 *
 * THE single source of truth for how a product's display name (`external_description`)
 * is built from its structured slot fields. Written once here, in the graphql repo,
 * and imported by BOTH:
 *   - the Phase-1/Phase-3 review + backfill tooling (scripts/generate-product-name-review.ts),
 *   - the backend `ProductsService.upsertProduct` (Phase 4), which computes the name
 *     on every upsert so names can never drift again.
 *
 * See docs/plans/ongoing/product-name-homogenization.md for the full plan.
 *
 * Canonical slot order (empty slots omitted):
 *
 *   Bags (Bolsa / Camiseta / Rollo / Rollo punteado — "Corte y empaque"):
 *     <Tipo> <Color> [<Línea>] [#<Modelo>] <ancho>[+<fuelle>]x<largo> cm [Cal <calibre>] [<Marca>] [<Presentación>] [<detalle>]
 *
 *   Bobinas ("Extrusión"):
 *     Bobina <Color> [<Uso>] <ancho> cm [Fuelle <n> cm] [Cal <calibre>]
 *
 * `computed = false` is the escape hatch: the name is taken verbatim from `manualName`
 * (placeholder / one-off rows the algorithm can't build from slots).
 */

export type ProductFamily = 'bag' | 'bobina';

export interface ProductNameSlots {
    /** When false, the algorithm does not build the name — `manualName` is used verbatim. */
    computed: boolean;
    /** Verbatim display name, used only when `computed = false`. */
    manualName?: string | null;

    /** Which formula to apply. Ignored when `computed = false`. */
    family?: ProductFamily;

    /** Tipo: Bolsa | Camiseta | Rollo | Rollo punteado (bags only; Bobina is implicit for the bobina family). */
    tipo?: string | null;
    /** Color token: Negra | Natural | Natural Reciclado | Transparente | Verde | Naranja | Azul | de Colores | Roja. */
    color?: string | null;
    /**
     * Línea (bag variant): para Basura | USO RUDO | de Hielo | para Despensa | de Empaque.
     * For the bobina family this slot carries the Uso: para Camiseta | para Empaque | para Hielo.
     */
    linea?: string | null;
    /** Modelo number for camisetas, WITHOUT the leading '#': e.g. '0'..'5'. */
    modelo?: string | null;

    /** ancho (cm). */
    width?: number | null;
    /** largo (cm). Bobinas have no largo. */
    length?: number | null;
    /** fuelle / gusset (cm). Rendered as `+<n>` before the `x` for bags, `Fuelle <n> cm` for bobinas. */
    pleat?: number | null;
    /** calibre. 0 (or null) omits the `Cal <n>` slot. */
    calibre?: number | null;

    /** Marca: INOPACK | PROMAX | DUERO | Grin Bags | Super Bags | MACARENA | Easy Home | BEDA | DUNOSUSA | Tatich. */
    brand?: string | null;
    /** Presentación: GRANEL | PAQUETEADA | 5EMP/5KG. */
    presentation?: string | null;
    /** Free-text presentation detail for counts, e.g. `30/10pz`, `(20 bolsas por rollo)`, `(1000 pz)`. */
    presentationDetail?: string | null;
}

/** Render a number keeping decimals but dropping a trailing `.0` (27.5 -> "27.5", 60 -> "60"). */
function num(n: number): string {
    if (!Number.isFinite(n)) return '';
    // Number() round-trip drops trailing zeros; String keeps meaningful decimals.
    return String(Number(n));
}

function has(n: number | null | undefined): n is number {
    return n !== null && n !== undefined && n !== 0;
}

function present(s: string | null | undefined): s is string {
    return typeof s === 'string' && s.trim().length > 0;
}

/**
 * Build the canonical display name from slots. Pure and deterministic — the same
 * input always yields the same string, with no DB or side effects.
 */
export function computeProductName(slots: ProductNameSlots): string {
    if (!slots.computed) {
        return (slots.manualName ?? '').trim();
    }

    const parts: string[] = [];

    if (slots.family === 'bobina') {
        parts.push('Bobina');
        if (present(slots.color)) parts.push(slots.color.trim());
        if (present(slots.linea)) parts.push(slots.linea.trim()); // Uso
        if (slots.width !== null && slots.width !== undefined) {
            parts.push(`${num(slots.width)} cm`);
        }
        if (has(slots.pleat)) parts.push(`Fuelle ${num(slots.pleat)} cm`);
        if (has(slots.calibre)) parts.push(`Cal ${num(slots.calibre)}`);
        return collapse(parts);
    }

    // bag family
    if (present(slots.tipo)) parts.push(slots.tipo.trim());
    if (present(slots.color)) parts.push(slots.color.trim());
    if (present(slots.linea)) parts.push(slots.linea.trim());
    if (present(slots.modelo)) parts.push(`#${slots.modelo.trim()}`);

    if (slots.width !== null && slots.width !== undefined) {
        let dims = num(slots.width);
        if (has(slots.pleat)) dims += `+${num(slots.pleat)}`;
        if (slots.length !== null && slots.length !== undefined) {
            dims += `x${num(slots.length)}`;
        }
        parts.push(`${dims} cm`);
    }

    if (has(slots.calibre)) parts.push(`Cal ${num(slots.calibre)}`);
    if (present(slots.brand)) parts.push(slots.brand.trim());
    if (present(slots.presentation)) parts.push(slots.presentation.trim());
    if (present(slots.presentationDetail)) parts.push(slots.presentationDetail.trim());

    return collapse(parts);
}

function collapse(parts: string[]): string {
    return parts.join(' ').replace(/\s+/g, ' ').trim();
}
