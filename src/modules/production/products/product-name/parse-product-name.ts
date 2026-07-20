/**
 * parse-product-name.ts
 *
 * Phase-1 / Phase-3 support (NOT shipped in the request path). Given a product row
 * (current name + structured columns), it proposes slot values for the canonical
 * name and FLAGS anything it can't confidently map. The proposed name is simply
 * `computeProductName(slots)` run over the extracted slots, so review validates the
 * round-trip: approved slots => computed name reads right.
 *
 * Philosophy (per the plan): the script PROPOSES, Mauricio DISPOSES. When in doubt,
 * flag rather than guess. Dimensions/calibre come from the structured columns (the
 * DB is authoritative); the current name is only mined for the word-slots that live
 * nowhere else (tipo, color, línea, modelo, marca, presentación) and to detect
 * name-vs-column mismatches.
 */

import { ProductNameSlots } from './compute-product-name';

export interface ProductRow {
    id: number;
    code: string;
    external_description: string;
    internal_description: string;
    width: number | null;
    length: number | null;
    pleat: number | null;
    calibre: number | null;
    discontinued: number | boolean;
    order_production_type_id: number | null;
    prod_type: string | null;
    product_category_id: number | null;
    category: string | null;
    product_material_id: number | null;
    material: string | null;
}

export interface ParseResult {
    slots: ProductNameSlots;
    /** Human-readable flags for the review table — anything needing Mauricio's eyes. */
    flags: string[];
    /** Name tokens the parser could not attribute to any slot (leftover dirt / ambiguity). */
    leftover: string[];
}

// ---------------------------------------------------------------------------
// Catalog tokens — the ONE official casing for each value. These become the
// catalog rows (product_colors, product_lines, product_brands, ...) in Phase 3.
// Each entry: canonical token + the aliases (case-insensitive) that map to it.
// ---------------------------------------------------------------------------

const COLORS: Array<[string, string[]]> = [
    ['Natural Reciclado', ['natural reciclado']],
    ['Transparente', ['transparente', 'trasparente']],
    ['Negra', ['negra', 'negro']],
    ['Verde', ['verde']],
    ['Naranja', ['naranja']],
    ['Azul', ['azul']],
    ['Roja', ['roja', 'rojo']],
    ['de Colores', ['de colores', 'colores', 'de color', 'color']],
    ['Natural', ['naturales', 'natural', 'natutal']], // 'Natutal' = known typo (id 201)
];

// Bag "Línea" and Bobina "Uso" share the slot. Order matters (longest/most-specific first).
const LINEAS: Array<[string, string[]]> = [
    ['para Basura', ['para basura', 'de basura']],
    ['USO RUDO', ['uso rudo', 'rudo']],
    ['de Hielo', ['de hielo']],
    ['para Despensa', ['para despensa', 'despensa']],
    ['de Empaque', ['de empaque']],
];

const BOBINA_USOS: Array<[string, string[]]> = [
    ['para Camiseta', ['para camiseta']],
    ['para Empaque', ['para empaque', 'empaque']],
    ['para Hielo', ['para hielo']],
];

const BRANDS: Array<[string, string[]]> = [
    ['Grin Bags', ['grin bags']],
    ['Super Bags', ['super bags']],
    ['Easy Home', ['easy home']],
    ['MACARENA', ['la macarena', 'macarena']],
    ['DUNOSUSA', ['dunosusa']],
    ['PROMAX', ['promax']],
    ['DUERO', ['duero']],
    ['INOPACK', ['inopack']],
    ['BEDA', ['plasticos beda', 'beda']],
    ['Tatich', ['tatich']],
];

const PRESENTATIONS: Array<[string, string[]]> = [
    ['5EMP/5KG', ['5emp/5kg']],
    ['GRANEL', ['granel']],
    ['PAQUETEADA', ['paqueteada']],
];

/** Rows the algorithm cannot build from slots — kept verbatim (computed_name = false). */
const PLACEHOLDER_CODES = new Set([
    'prestamo',
    'comisiones',
    'carton',
    'maquinaria',
    'compactado',
]);

function isPlaceholder(row: ProductRow): boolean {
    const code = (row.code || '').trim().toLowerCase();
    const name = (row.external_description || '').trim().toLowerCase();
    if (PLACEHOLDER_CODES.has(code)) return true;
    if (name.startsWith('pellet')) return true; // Pellet * rows
    if (row.prod_type === 'Peletizado') return true;
    if (name.startsWith('fabricacion especial')) return true;
    return false;
}

/** Find the first catalog token whose alias appears in `hay` (already lower-cased). */
function matchToken(
    hay: string,
    table: Array<[string, string[]]>,
): { token: string; alias: string } | null {
    for (const [token, aliases] of table) {
        for (const alias of aliases) {
            if (wordIncludes(hay, alias)) return { token, alias };
        }
    }
    return null;
}

/**
 * Find EVERY catalog token present in `hay`, in table order (one alias per token).
 * Used for Línea, which can carry two words at once — e.g. `para Basura` + `USO RUDO`
 * — that combine into a compound token (decided 2026-07-20: keep both).
 */
function matchAllTokens(
    hay: string,
    table: Array<[string, string[]]>,
): Array<{ token: string; alias: string }> {
    const out: Array<{ token: string; alias: string }> = [];
    for (const [token, aliases] of table) {
        for (const alias of aliases) {
            if (wordIncludes(hay, alias)) {
                out.push({ token, alias });
                break;
            }
        }
    }
    return out;
}

/** Whole-word-ish contains: avoids "color" matching inside "colores" incorrectly, etc. */
function wordIncludes(hay: string, needle: string): boolean {
    const idx = hay.indexOf(needle);
    if (idx === -1) return false;
    const before = idx === 0 ? ' ' : hay[idx - 1];
    const after = idx + needle.length >= hay.length ? ' ' : hay[idx + needle.length];
    return !/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after);
}

function truthyDiscontinued(v: number | boolean): boolean {
    return v === true || v === 1;
}

/** Extract every `WxH`-ish dimension pair mentioned in the name (for mismatch checks). */
function nameDims(name: string): Array<{ w: number; h: number }> {
    const out: Array<{ w: number; h: number }> = [];
    const re = /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(name)) !== null) {
        out.push({ w: parseFloat(m[1]), h: parseFloat(m[2]) });
    }
    return out;
}

/** Extract calibre value mentioned in the name (Cal / Calibre N), if any. */
function nameCalibre(name: string): number | null {
    const m = name.match(/\b(?:cal|calibre)\s*\.?\s*(\d+)/i);
    return m ? parseInt(m[1], 10) : null;
}

/** Extract a camiseta model number from the name: `#3`, `(#3)`, `Modelo #3`, `C#3`, `C3`. */
function nameModelo(name: string): string | null {
    let m = name.match(/#\s*(\d)/); // #3 / (#3) / Modelo #3
    if (m) return m[1];
    m = name.match(/\bModelo\s+#?\s*(\d)/i);
    if (m) return m[1];
    return null;
}

/** Detect free-text presentation detail counts (kept verbatim into presentationDetail). */
function namePresentationDetail(name: string): string | null {
    // parenthesised counts: (20 bolsas), (1000 pz), (15 rollos por bulto), (150 bolsas)
    const paren = name.match(/\(([^)]*\b(?:bolsas?|pz|pzs?|rollos?)\b[^)]*)\)/i);
    if (paren) return `(${paren[1].trim()})`;
    // slash counts: 30/10pz, 30/5pz
    const slash = name.match(/\b(\d+\/\d+\s*pz)\b/i);
    if (slash) return slash[1].replace(/\s+/g, '');
    return null;
}

export function parseProductName(row: ProductRow): ParseResult {
    const flags: string[] = [];
    const leftover: string[] = [];
    const rawName = row.external_description ?? '';
    const name = rawName.trim();
    const lower = name.toLowerCase();

    // --- universal dirt flags -------------------------------------------------
    if (rawName !== name) flags.push('trailing/leading whitespace in name');
    if (/natutal/i.test(rawName)) flags.push('typo "Natutal" -> Natural');
    if (/descontinuado/i.test(rawName)) {
        flags.push('"(DESCONTINUADO)" embedded in name — drop, rely on discontinued flag');
    }
    if (truthyDiscontinued(row.discontinued) && !/descontinuado/i.test(rawName)) {
        // informational only, not a flag: discontinued flag set, name clean (expected).
    }

    // --- placeholder / manual rows -------------------------------------------
    if (isPlaceholder(row)) {
        flags.push('placeholder/one-off — computed_name = false (name kept verbatim)');
        return {
            slots: { computed: false, manualName: name },
            flags,
            leftover,
        };
    }

    const family: 'bag' | 'bobina' =
        row.prod_type === 'Extrusion' || /^bobina\b/i.test(name) ? 'bobina' : 'bag';

    // consumed tracks which name substrings we've attributed, to compute leftovers.
    let residue = ` ${lower} `;
    const consume = (alias: string) => {
        residue = residue.split(alias).join(' ');
    };

    // --- calibre (column authoritative; flag name/column mismatch) -----------
    const colCalibre = row.calibre ?? 0;
    const nCal = nameCalibre(lower);
    if (nCal !== null) consume(`cal ${nCal}`), consume(`calibre ${nCal}`);
    if (nCal !== null && colCalibre !== 0 && nCal !== colCalibre) {
        flags.push(`calibre mismatch: name says ${nCal}, column = ${colCalibre} (column wins)`);
    }
    if (colCalibre === 0 && nCal !== null) {
        flags.push(`calibre in name (${nCal}) but column = 0 — set column?`);
    }

    // --- dimensions (column authoritative; flag mismatch) --------------------
    // Rollos punteados display the printed CUT width; the column stores tube width
    // = 2× that (decided 2026-07-20). When detected, the display width is overridden
    // to the cut width and Phase 3 corrects the column.
    let cutWidthOverride: number | null = null;
    const dimsInName = nameDims(lower);
    for (const d of dimsInName) consume(`${d.w}x${d.h}`), consume(`${d.w} x ${d.h}`);
    if (row.width != null && row.length != null && dimsInName.length > 0) {
        const w = row.width;
        const l = row.length;
        const exact = dimsInName.some(
            (d) =>
                (approx(d.w, w) && approx(d.h, l)) ||
                (approx(d.w, l) && approx(d.h, w)), // width/length swapped in column
        );
        const doubledDim = !exact
            ? dimsInName.find((d) => approx(d.w * 2, w))
            : undefined;
        if (doubledDim) {
            cutWidthOverride = doubledDim.w;
            flags.push(
                `tube/cut width: column width ${w} = 2× cut width ${doubledDim.w}; ` +
                    `display uses the CUT width (${doubledDim.w}) — Phase 3 stores cut width in the column`,
            );
        } else if (!exact) {
            flags.push(
                `dimension mismatch: name ${dimsInName
                    .map((d) => `${d.w}x${d.h}`)
                    .join(',')} vs column ${w}x${l}`,
            );
        }
    }

    if (family === 'bobina') {
        const slots = parseBobina(row, lower, name, consume);
        collectLeftover(residue, leftover);
        return { slots, flags, leftover };
    }

    const slots = parseBag(row, lower, name, consume, flags, cutWidthOverride);
    collectLeftover(residue, leftover);
    return { slots, flags, leftover };

    function collectLeftover(res: string, out: string[]) {
        const junk = res
            .replace(/\bcm\b/g, ' ')
            .replace(/\bde\b/g, ' ')
            .replace(/[()]/g, ' ')
            .replace(/[+.]/g, ' ')
            .replace(/\d+/g, ' ')
            .split(/\s+/)
            .map((t) => t.trim())
            .filter((t) => t.length > 1);
        for (const t of junk) if (!out.includes(t)) out.push(t);
        if (junk.length) flags.push(`unmapped tokens: ${junk.join(' ')}`);
    }
}

function approx(a: number, b: number): boolean {
    return Math.abs(a - b) < 0.001;
}

function parseBobina(
    row: ProductRow,
    lower: string,
    name: string,
    consume: (a: string) => void,
): ProductNameSlots {
    const uso = matchToken(lower, BOBINA_USOS);
    if (uso) consume(uso.alias);
    // Color: bobinas don't carry a color when they carry a Uso (para camiseta/empaque).
    let color: string | null = null;
    const cm = matchToken(lower, COLORS);
    if (cm && !uso) {
        color = cm.token;
        consume(cm.alias);
    } else if (cm && uso) {
        // e.g. "Bobina natural para camiseta" -> keep color too
        color = cm.token;
        consume(cm.alias);
    }
    consume('bobina');

    // Fuelle lives only in the bobina name (pleat column is null for bobinas).
    const fuelle = name.match(/fuelle\s*(\d+(?:\.\d+)?)/i);
    let pleat: number | null = row.pleat ?? null;
    if (fuelle) {
        pleat = parseFloat(fuelle[1]);
        consume(`fuelle ${fuelle[1]}`.toLowerCase());
    }

    return {
        computed: true,
        family: 'bobina',
        color,
        linea: uso ? uso.token : null,
        width: row.width ?? null,
        length: null,
        pleat,
        calibre: row.calibre ?? null,
    };
}

function parseBag(
    row: ProductRow,
    lower: string,
    name: string,
    consume: (a: string) => void,
    flags: string[],
    cutWidthOverride: number | null,
): ProductNameSlots {
    // --- Tipo ---------------------------------------------------------------
    let tipo: string | null = null;
    if (/\brollo\s+punteado\b/i.test(name) || row.category === 'Rollo punteado') {
        tipo = 'Rollo punteado';
        consume('rollo punteado');
    } else if (/^camiseta\b/i.test(name) || row.category === 'Camiseta') {
        tipo = 'Camiseta';
        consume('camiseta');
    } else if (/\brollo\b/i.test(name) || row.category === 'Sello de fondo bobina') {
        tipo = 'Rollo';
        consume('en rollo'); // strip the "en Rollo" filler before the bare "rollo"
        consume('rollo');
    } else if (/^bolsa\b/i.test(name)) {
        tipo = 'Bolsa';
        consume('bolsa');
    } else {
        // No noun in the name (e.g. bare "Transparente 60 x 90", "Easy Home 90 x 120").
        tipo = 'Bolsa';
        flags.push('no Tipo noun in name — defaulted to "Bolsa", confirm');
    }
    consume('bolsas'); // plural forms
    consume('bolsa');

    // --- Color (name only; NEVER inferred from material — decided 2026-07-20) --
    let color: string | null = null;
    const cm = matchToken(lower, COLORS);
    if (cm) {
        color = cm.token;
        consume(cm.alias);
    } else {
        // Leave color blank for Mauricio to set by hand; offer a suggestion (not applied).
        const suggest =
            row.material === 'Natural reciclado'
                ? 'Natural Reciclado'
                : row.material === 'Virgen'
                ? 'Natural'
                : row.material === 'Color reciclado'
                ? 'Negra'
                : null;
        flags.push(
            `color not in name — set by hand${
                suggest ? ` (material '${row.material}' suggests ${suggest})` : ''
            }`,
        );
    }

    // --- Línea (keep every línea word — compound, decided 2026-07-20) ---------
    const lins = matchAllTokens(lower, LINEAS);
    for (const m of lins) consume(m.alias);
    const linea = lins.length ? lins.map((m) => m.token).join(' ') : null;

    // --- Modelo (camisetas) -------------------------------------------------
    let modelo: string | null = null;
    if (tipo === 'Camiseta') {
        modelo = nameModelo(name);
        if (modelo === null) flags.push('camiseta without model number — confirm');
    }

    // --- Marca --------------------------------------------------------------
    const brand = matchToken(lower, BRANDS);
    if (brand) consume(brand.alias);

    // --- Presentación -------------------------------------------------------
    const pres = matchToken(lower, PRESENTATIONS);
    if (pres) consume(pres.alias);
    const detail = namePresentationDetail(name);
    if (detail) {
        // Consume the whole detail (and its parenthesised inner text) so its words
        // don't resurface as "unmapped tokens".
        consume(detail.toLowerCase());
        consume(detail.toLowerCase().replace(/[()]/g, ''));
    }

    return {
        computed: true,
        family: 'bag',
        tipo,
        color,
        linea,
        modelo,
        width: cutWidthOverride ?? row.width ?? null,
        length: row.length ?? null,
        pleat: row.pleat ?? null,
        calibre: row.calibre ?? null,
        brand: brand ? brand.token : null,
        presentation: pres ? pres.token : null,
        presentationDetail: detail,
    };
}

/** Compact one-line rendering of the slots for the review table. */
export function slotsToString(s: ProductNameSlots): string {
    if (!s.computed) return `computed=false; manual="${s.manualName ?? ''}"`;
    const kv: string[] = [`family=${s.family}`];
    const push = (k: string, v: unknown) => {
        if (v !== null && v !== undefined && v !== '') kv.push(`${k}=${v}`);
    };
    push('tipo', s.tipo);
    push('color', s.color);
    push('linea', s.linea);
    push('modelo', s.modelo);
    push('w', s.width);
    push('l', s.length);
    push('pleat', s.pleat);
    push('cal', s.calibre);
    push('brand', s.brand);
    push('pres', s.presentation);
    push('detail', s.presentationDetail);
    return kv.join('; ');
}
