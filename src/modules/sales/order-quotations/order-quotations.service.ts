import dayjs from 'dayjs';
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    Account,
    AccountContact,
    AccountProduct,
    AccountProductInput,
    AccountResource,
    AccountUpsertInput,
    ActivityEntityName,
    ActivityTypeName,
    GetOrderQuotationsArgs,
    OrderQuotation,
    OrderQuotationCatalogAction,
    OrderQuotationCatalogChange,
    OrderQuotationCatalogPreview,
    OrderQuotationInput,
    OrderQuotationPedidoStepState,
    OrderQuotationProduct,
    OrderQuotationsSortArgs,
    OrderQuotationStatus,
    OrderRequest,
    OrderRequestInput,
    PaginatedOrderQuotations,
    PaginatedOrderQuotationsQueryArgs,
    Product,
} from '../../../common/dto/entities';
import {
    getCreatedAtProperty,
    getCreatedByProperty,
    getUpdatedAtProperty,
    getUpdatedByProperty,
    vennDiagram,
} from '../../../common/helpers';
import { BUSINESS_TZ } from '../../../common/helpers/dates/business-day';
import {
    OffsetPaginatorArgs,
    DatePaginator,
} from '../../../common/dto/pagination';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { AccountsService } from '../../management/accounts/accounts.service';
import { OrderRequestsService } from '../order-requests/order-requests.service';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import {
    captureSnapshotSafely,
    INTENTIONALLY_ABSENT,
} from '../../../common/modules/pub-sub/activity-audit';

// The status ids seeded by 1786060000000-AddOrderQuotations, in order:
// 1 Borrador, 2 Enviada, 3 Aceptada, 4 Rechazada. Only Enviada (2) is
// acceptable: a Borrador is still a draft, so it must be sent first; Aceptada
// and Rechazada are terminal.
const STATUS_BORRADOR = 1;
const STATUS_ENVIADA = 2;
const STATUS_ACEPTADA = 3;
const STATUS_RECHAZADA = 4;

@Injectable()
export class OrderQuotationsService {
    constructor(
        private prisma: PrismaService,
        private accountsService: AccountsService,
        private orderRequestsService: OrderRequestsService,
        private pubSubService: PubSubService,
    ) {}

    // The single price rule, applied EVERYWHERE (upsert validation, the catalog
    // preview, and acceptance): EXACTLY ONE of kilo_price / group_price is
    // greater than zero and the other is exactly zero. Both zero is invalid
    // (no price), both positive is invalid (ambiguous), and a negative price is
    // invalid. Since negatives are rejected first, "exactly one positive" reduces
    // to an XOR. Keep this in lockstep with the frontend rule
    // (make-is-quotation-price-valid.ts). See the plan, "Make price validation
    // consistent".
    static isLinePriceValid(kilo_price: number, group_price: number): boolean {
        if (kilo_price < 0 || group_price < 0) return false;
        const kiloPositive = kilo_price > 0;
        const groupPositive = group_price > 0;
        return kiloPositive !== groupPositive;
    }

    async getOrderQuotations({
        order_quotation_status_ids,
    }: GetOrderQuotationsArgs): Promise<OrderQuotation[]> {
        if (!order_quotation_status_ids) return [];

        return this.prisma.order_quotations.findMany({
            where: {
                AND: [
                    {
                        active: 1,
                    },
                    {
                        OR: order_quotation_status_ids.map((id) => {
                            return {
                                order_quotation_status_id: id,
                            };
                        }),
                    },
                ],
            },
        });
    }

    // Audit snapshot for the activity trail. Deliberately separate from
    // getOrderQuotation, which is a bare row read with many callers that must
    // not pay for a child fetch.
    //
    // No `active: 1` on the quotation itself, so a snapshot still works after
    // the soft delete. But `active: 1` on the CHILD lines is load-bearing: lines
    // are soft-deleted rather than removed, so an unfiltered snapshot would ship
    // a removed line with only its `active` flag changed — and the React differ
    // ignores `active`, which would make the deletion vanish from the audit
    // entirely. See docs/features/ongoing/feature-activities-audit.md §2c-1 and
    // the identical comment on getOrderRequestSnapshot.
    async getOrderQuotationSnapshot({
        order_quotation_id,
    }: {
        order_quotation_id: number;
    }): Promise<unknown> {
        return this.prisma.order_quotations.findUnique({
            where: {
                id: order_quotation_id,
            },
            include: {
                // Foreign keys, denormalised to id + name so the diff reads the
                // name rather than the number.
                accounts: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                order_quotation_statuses: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                order_quotation_products: {
                    where: {
                        active: 1,
                    },
                    include: {
                        products: {
                            select: {
                                id: true,
                                code: true,
                                description: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async getOrderQuotation({
        orderQuotationId,
    }: {
        orderQuotationId: number;
    }): Promise<OrderQuotation | null> {
        if (!orderQuotationId) return null;

        return this.prisma.order_quotations.findFirst({
            where: {
                id: orderQuotationId,
                active: 1,
            },
        });
    }

    // Cotización codes have their OWN sequence, independent of pedido codes.
    // Restricted to active rows so the suggested folio agrees with
    // isOrderQuotationCodeOccupied (which is also active-only): a soft-deleted
    // folio is free to reuse there, so it must not inflate the suggested next
    // code here. Without this, a deletion left a gap the occupied check would
    // happily let you fill, yet the suggestion skipped past it.
    async getOrderQuotationMaxOrderCode(): Promise<number> {
        const {
            _max: { order_code },
        } = await this.prisma.order_quotations.aggregate({
            where: {
                active: 1,
            },
            _max: {
                order_code: true,
            },
        });

        return !!order_code ? order_code : 0;
    }

    async paginatedOrderQuotations({
        offsetPaginatorArgs,
        datePaginator,
        paginatedOrderQuotationsQueryArgs,
        orderQuotationsSortArgs,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        datePaginator: DatePaginator;
        paginatedOrderQuotationsQueryArgs: PaginatedOrderQuotationsQueryArgs;
        orderQuotationsSortArgs: OrderQuotationsSortArgs;
    }): Promise<PaginatedOrderQuotations> {
        const startDate = datePaginator.start_date
            ? dayjs(datePaginator.start_date).utc().startOf('day').toDate()
            : undefined;
        const endDate = datePaginator.end_date
            ? dayjs(datePaginator.end_date).utc().endOf('day').toDate()
            : undefined;

        const { sort_order, sort_field } = orderQuotationsSortArgs;

        const filter =
            paginatedOrderQuotationsQueryArgs.filter !== '' &&
            !!paginatedOrderQuotationsQueryArgs.filter
                ? paginatedOrderQuotationsQueryArgs.filter
                : undefined;

        const isFilterANumber = !Number.isNaN(Number(filter));

        const where: Prisma.order_quotationsWhereInput = {
            AND: [
                {
                    active: 1,
                },
                {
                    date: {
                        gte: startDate,
                    },
                },
                {
                    date: {
                        lt: endDate,
                    },
                },
                {
                    account_id:
                        paginatedOrderQuotationsQueryArgs.account_id ||
                        undefined,
                },
                {
                    order_quotation_status_id:
                        paginatedOrderQuotationsQueryArgs.order_quotation_status_id ||
                        undefined,
                },
                ...(filter
                    ? [
                          {
                              OR: [
                                  ...(isFilterANumber
                                      ? [
                                            {
                                                order_code: {
                                                    in: [Number(filter)],
                                                },
                                            },
                                        ]
                                      : []),
                                  {
                                      notes: {
                                          contains: filter,
                                      },
                                  },
                                  {
                                      accounts: {
                                          name: {
                                              contains: filter,
                                          },
                                      },
                                  },
                                  {
                                      order_quotation_products: {
                                          some: {
                                              products: {
                                                  description: {
                                                      contains: filter,
                                                  },
                                              },
                                              active: 1,
                                          },
                                      },
                                  },
                                  // Free lines carry their spec in
                                  // proposed_description rather than a product,
                                  // so the text filter has to reach it too.
                                  {
                                      order_quotation_products: {
                                          some: {
                                              proposed_description: {
                                                  contains: filter,
                                              },
                                              active: 1,
                                          },
                                      },
                                  },
                              ],
                          },
                      ]
                    : []),
            ],
        };

        let orderBy: Prisma.order_quotationsOrderByWithRelationInput = {
            updated_at: 'desc',
        };

        if (sort_order && sort_field) {
            if (sort_field === 'order_code') {
                orderBy = {
                    order_code: sort_order,
                };
            } else if (sort_field === 'estimated_delivery_date') {
                orderBy = {
                    estimated_delivery_date: sort_order,
                };
            } else if (sort_field === 'expiration_date') {
                orderBy = {
                    expiration_date: sort_order,
                };
            } else if (sort_field === 'date') {
                orderBy = {
                    date: sort_order,
                };
            }
        }

        const orderQuotationsCount = await this.prisma.order_quotations.count({
            where: where,
        });
        const orderQuotations = await this.prisma.order_quotations.findMany({
            where: where,
            take: offsetPaginatorArgs.take,
            skip: offsetPaginatorArgs.skip,
            orderBy: orderBy,
        });

        return {
            count: orderQuotationsCount,
            docs: orderQuotations,
        };
    }

    async isOrderQuotationCodeOccupied({
        order_code,
        order_quotation_id,
    }: {
        order_quotation_id: number | null;
        order_code: number;
    }): Promise<boolean> {
        const orderQuotation = await this.prisma.order_quotations.findFirst({
            where: {
                AND: [
                    {
                        order_code: order_code,
                    },
                    {
                        active: 1,
                    },
                ],
            },
        });

        return order_quotation_id && order_quotation_id >= 0 && orderQuotation
            ? orderQuotation.id !== order_quotation_id
            : !!orderQuotation;
    }

    async getOrderQuotationProducts({
        order_quotation_id,
    }: {
        order_quotation_id: number;
    }): Promise<OrderQuotationProduct[]> {
        return this.prisma.order_quotation_products.findMany({
            where: {
                AND: [
                    {
                        order_quotation_id: order_quotation_id,
                    },
                    {
                        active: 1,
                    },
                ],
            },
        });
    }

    // The money subtotal — the raw sum of the lines. subtotal / products_total
    // are the same value (both @ResolveFields); tax and total derive from it.
    // Money is DERIVED, never stored: a cotización is not a comprobante.
    async getOrderQuotationProductsTotal({
        order_quotation_id,
    }: {
        order_quotation_id: number;
    }): Promise<number> {
        const orderQuotationProducts =
            await this.prisma.order_quotation_products.findMany({
                where: {
                    AND: [
                        {
                            order_quotation_id: order_quotation_id,
                        },
                        {
                            active: 1,
                        },
                    ],
                },
            });

        const total = orderQuotationProducts.reduce((acc, product) => {
            return (
                acc +
                product.kilo_price * product.kilos +
                product.group_price * product.groups
            );
        }, 0);

        return Math.round(total * 100) / 100;
    }

    // IVA visible: 16% when require_tax, 0% otherwise (sales convention).
    async getOrderQuotationTax({
        order_quotation_id,
        require_tax,
    }: {
        order_quotation_id: number;
        require_tax: boolean;
    }): Promise<number> {
        if (!require_tax) return 0;

        const subtotal = await this.getOrderQuotationProductsTotal({
            order_quotation_id,
        });

        return Math.round(subtotal * 0.16 * 100) / 100;
    }

    async getOrderQuotationTotal({
        order_quotation_id,
        require_tax,
    }: {
        order_quotation_id: number;
        require_tax: boolean;
    }): Promise<number> {
        const subtotal = await this.getOrderQuotationProductsTotal({
            order_quotation_id,
        });
        const tax = require_tax ? subtotal * 0.16 : 0;

        return Math.round((subtotal + tax) * 100) / 100;
    }

    // Vencida is derived, not stored: expiration_date < today. A blank vigencia
    // (NULL) never expires.
    //
    // expiration_date is a BUSINESS CALENDAR date, so "today" is the current
    // calendar date in Mexico City (America/Mexico_City), NOT the UTC calendar
    // day. Comparing against the UTC day would flip a quotation to vencida after
    // ~18:00 local (once UTC has already rolled to the next date) while it is
    // still valid locally. Both sides are reduced to a YYYY-MM-DD string and
    // compared lexicographically (valid for that format). See the plan, "Use the
    // Mexico City business date for expiration".
    isExpired({ expiration_date }: { expiration_date?: Date | null }): boolean {
        if (!expiration_date) return false;

        const businessToday = dayjs().tz(BUSINESS_TZ).format('YYYY-MM-DD');
        const expirationDate = dayjs.utc(expiration_date).format('YYYY-MM-DD');

        return expirationDate < businessToday;
    }

    // Whether the quotation is in a state that acceptance would accept. Pure
    // read, no side effects. It is exactly `getAcceptanceBlockingReasons` with
    // an empty result — the same predicate acceptOrderQuotation enforces and the
    // preview surfaces, so the button, the refusal, and the explanation can
    // never drift apart.
    async isAcceptable({
        order_quotation_id,
    }: {
        order_quotation_id: number;
    }): Promise<boolean> {
        const orderQuotation = await this.getOrderQuotation({
            orderQuotationId: order_quotation_id,
        });

        if (!orderQuotation) return false;

        const reasons = await this.getAcceptanceBlockingReasons({
            orderQuotation,
        });
        return reasons.length === 0;
    }

    // The single source of "why can this not be accepted". Reused by
    // isAcceptable, the catalog preview (to explain a disabled button), and
    // acceptOrderQuotation (to refuse). User-facing Spanish, since the preview
    // shows these verbatim. Acceptable requires: the Enviada (sent) status
    // specifically; not expired; the account still a client; at least one line;
    // and every line linked to a real product (a free line means Producción has
    // not created the specification yet), naming the offending lines.
    private async getAcceptanceBlockingReasons({
        orderQuotation,
    }: {
        orderQuotation: OrderQuotation;
    }): Promise<string[]> {
        const reasons: string[] = [];

        const status = orderQuotation.order_quotation_status_id;
        if (status === STATUS_ACEPTADA) {
            reasons.push('La cotización ya fue aceptada');
        } else if (status === STATUS_RECHAZADA) {
            reasons.push('La cotización fue rechazada');
        } else if (status !== STATUS_ENVIADA) {
            // Only a sent (Enviada) quotation can be accepted. A Borrador — or
            // any non-terminal status that isn't Enviada — must be sent first.
            reasons.push(
                'La cotización debe estar enviada para poder aceptarse',
            );
        }

        if (
            this.isExpired({ expiration_date: orderQuotation.expiration_date })
        ) {
            reasons.push('La cotización está vencida');
        }

        const account = orderQuotation.account_id
            ? await this.prisma.accounts.findFirst({
                  where: { id: orderQuotation.account_id },
              })
            : null;
        if (!account || !account.is_client) {
            reasons.push('La cuenta no es cliente');
        }

        const lines = await this.getOrderQuotationProducts({
            order_quotation_id: orderQuotation.id,
        });
        if (lines.length === 0) {
            reasons.push('La cotización no tiene líneas');
        }

        // Name the free lines: creating those products is Producción's job, not
        // the accepter's, so the message has to point at the exact lines.
        const freeLineNumbers = lines
            .map((line, index) => (!line.product_id ? index + 1 : null))
            .filter((n): n is number => n !== null);
        if (freeLineNumbers.length > 0) {
            reasons.push(
                `Líneas sin producto (Producción debe crear el producto primero): ${freeLineNumbers.join(
                    ', ',
                )}`,
            );
        }

        // A product can become inactive or discontinued after the quotation was
        // captured. Re-check at acceptance so an old linked line cannot enter
        // the client catalog or the generated pedido after it stops being
        // eligible for new commercial documents.
        const linkedProductIds = Array.from(
            new Set(
                lines
                    .map((line) => line.product_id)
                    .filter((id): id is number => id != null),
            ),
        );
        const linkedProducts =
            linkedProductIds.length > 0
                ? await this.prisma.products.findMany({
                      where: { id: { in: linkedProductIds } },
                  })
                : [];
        const productById = new Map(
            linkedProducts.map((product) => [product.id, product]),
        );
        const unavailableProductLineNumbers = lines
            .map((line, index) => {
                if (line.product_id == null) return null;
                const product = productById.get(line.product_id);
                return !product || product.active !== 1 || product.discontinued
                    ? index + 1
                    : null;
            })
            .filter((n): n is number => n !== null);
        if (unavailableProductLineNumbers.length > 0) {
            reasons.push(
                `Líneas con producto inactivo o descontinuado: ${unavailableProductLineNumbers.join(
                    ', ',
                )}`,
            );
        }

        // Legacy / invalid prices: EXACTLY ONE of kilo/group price must be > 0.
        // A quotation captured before this rule (both zero, both positive, or a
        // negative) is blocked from acceptance and must be corrected first —
        // never silently pushed into the catalog. Names the offending lines.
        const invalidPriceLineNumbers = lines
            .map((line, index) =>
                OrderQuotationsService.isLinePriceValid(
                    line.kilo_price,
                    line.group_price,
                )
                    ? null
                    : index + 1,
            )
            .filter((n): n is number => n !== null);
        if (invalidPriceLineNumbers.length > 0) {
            reasons.push(
                `Líneas con precio inválido (debe ser exactamente uno de precio por kilo o por bulto): ${invalidPriceLineNumbers.join(
                    ', ',
                )}`,
            );
        }

        // DIAGNOSTIC half-state: a pedido row is linked but its creation was
        // never stamped completed (order_request_completed_at is NULL). The app
        // must NOT create another pedido or repair this one — it blocks the step
        // and an engineer diagnoses it by hand. The linked pedido's code is named
        // so the diagnostics tab and logs point at the same row. See the plan,
        // "The pedido completion marker".
        if (!orderQuotation.order_request_completed_at) {
            const linkedPedido = await this.prisma.order_requests.findFirst({
                where: { order_quotation_id: orderQuotation.id },
            });
            if (linkedPedido) {
                reasons.push(
                    `El pedido #${linkedPedido.order_code} existe pero su creación no se marcó como completada. Espera a que se diagnostique el problema de software antes de continuar.`,
                );
            }
        }

        return reasons;
    }

    async upsertOrderQuotation({
        input,
        current_user_id,
    }: {
        input: OrderQuotationInput;
        current_user_id: number;
    }): Promise<OrderQuotation> {
        await this.validateOrderQuotation(input, current_user_id);

        const orderQuotation = await this.prisma.order_quotations.upsert({
            create: {
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                ...getCreatedByProperty(current_user_id),
                ...getUpdatedByProperty(current_user_id),
                notes: input.notes,
                date: input.date,
                order_code: input.order_code,
                estimated_delivery_date: input.estimated_delivery_date,
                account_id: input.account_id,
                expiration_date: input.expiration_date,
                payment_terms: input.payment_terms,
                require_tax: input.require_tax,
                // Status is not part of the input: new quotations always start at
                // Borrador (id = 1). Only updateOrderQuotationStatus (admin-only)
                // can change it afterwards.
                order_quotation_status_id: 1,
            },
            update: {
                ...getUpdatedAtProperty(),
                ...getUpdatedByProperty(current_user_id),
                notes: input.notes,
                date: input.date,
                order_code: input.order_code,
                estimated_delivery_date: input.estimated_delivery_date,
                account_id: input.account_id,
                expiration_date: input.expiration_date,
                payment_terms: input.payment_terms,
                require_tax: input.require_tax,
                // Intentionally omit order_quotation_status_id and
                // account_products_updated_at so an upsert never overwrites a
                // status an admin set nor the stored catalog-write stamp.
            },
            where: {
                id: input.id || 0,
            },
        });

        const newProductItems = input.order_quotation_products;
        const oldProductItems = input.id
            ? await this.prisma.order_quotation_products.findMany({
                  where: {
                      order_quotation_id: input.id,
                  },
              })
            : [];

        const {
            aMinusB: deleteProductItems,
            bMinusA: createProductItems,
            intersection: updateProductItems,
        } = vennDiagram({
            a: oldProductItems,
            b: newProductItems,
            indexProperties: ['id'],
        });

        for await (const delItem of deleteProductItems) {
            if (delItem && delItem.id) {
                await this.prisma.order_quotation_products.updateMany({
                    data: {
                        ...getUpdatedAtProperty(),
                        active: -1,
                    },
                    where: {
                        id: delItem.id,
                    },
                });
            }
        }

        for await (const createItem of createProductItems) {
            await this.prisma.order_quotation_products.create({
                data: {
                    ...getCreatedAtProperty(),
                    ...getUpdatedAtProperty(),
                    kilo_price: createItem.kilo_price,
                    group_price: createItem.group_price,
                    order_quotation_id: orderQuotation.id,
                    product_id: createItem.product_id,
                    proposed_description: createItem.proposed_description,
                    kilos: createItem.kilos,
                    active: 1,
                    group_weight: createItem.group_weight,
                    groups: createItem.groups,
                },
            });
        }

        for await (const updateItem of updateProductItems) {
            if (updateItem && updateItem.id) {
                await this.prisma.order_quotation_products.updateMany({
                    data: {
                        ...getUpdatedAtProperty(),
                        product_id: updateItem.product_id,
                        proposed_description: updateItem.proposed_description,
                        kilos: updateItem.kilos,
                        active: 1,
                        group_weight: updateItem.group_weight,
                        groups: updateItem.groups,
                        kilo_price: updateItem.kilo_price,
                        group_price: updateItem.group_price,
                    },
                    where: {
                        id: updateItem.id,
                    },
                });
            }
        }

        return orderQuotation;
    }

    // Admin-only status change, kept separate from upsert so that regular sales
    // users editing a quotation can never move its status. Gated at the resolver
    // with RoleId.ADMIN.
    async updateOrderQuotationStatus({
        order_quotation_id,
        order_quotation_status_id,
    }: {
        order_quotation_id: number;
        order_quotation_status_id: number;
    }): Promise<OrderQuotation> {
        const orderQuotation = await this.getOrderQuotation({
            orderQuotationId: order_quotation_id,
        });

        if (!orderQuotation) {
            throw new NotFoundException();
        }

        const orderQuotationStatus =
            await this.prisma.order_quotation_statuses.findFirst({
                where: { id: order_quotation_status_id },
            });

        if (!orderQuotationStatus) {
            throw new BadRequestException([
                `order quotation status (${order_quotation_status_id}) does not exist`,
            ]);
        }

        // Aceptada is reachable ONLY through acceptOrderQuotation — setting it
        // here would be a second door that marks the quotation accepted without
        // writing the catalog or creating the pedido. See the plan, "Acceptance
        // is terminal".
        if (order_quotation_status_id === STATUS_ACEPTADA) {
            throw new BadRequestException([
                'Usa aceptar cotización para marcarla como Aceptada',
            ]);
        }

        // Acceptance-start lock: once acceptance has started (catalog written, a
        // pedido linked, completion stamped, or already Aceptada) no ordinary
        // status change is allowed — including moving back to Borrador or
        // Rechazada. Only the internal acceptance flow (markAccepted, a direct
        // update that bypasses this method) may set the final Aceptada. See the
        // plan, "Lock quotation changes after acceptance starts".
        if (await this.hasAcceptanceStarted(orderQuotation)) {
            throw new BadRequestException([
                'La aceptación de la cotización ya inició; su estado no puede cambiarse',
            ]);
        }

        return this.prisma.order_quotations.update({
            data: {
                ...getUpdatedAtProperty(),
                order_quotation_status_id: order_quotation_status_id,
            },
            where: {
                id: order_quotation_id,
            },
        });
    }

    // Focused mutation: point a persisted FREE line at a real product, WITHOUT
    // going through the whole upsert (which would rewrite the entire lines set).
    // This is the "Ventas apunta la línea libre al producto ya creado" step of
    // the flow. It sets ONLY product_id — quantities, description, group weight
    // and prices are left exactly as captured; nothing is auto-adjusted. Rules:
    //   · SALES role (gated at the resolver)
    //   · quotation must be Borrador or Enviada, and acceptance not yet started
    //   · the line must currently be a free line (no relinking an already-linked)
    //   · the product must exist and be active
    //   · the quoted group weight must be COMPATIBLE with the product (same rule
    //     linked lines validate), so the newly linked line is not left in a state
    //     the upsert or acceptance would reject — an incompatible weight is
    //     refused, not silently rewritten
    // Publishes the quotation subscription event with the standard audit envelope
    // (mirroring acceptOrderQuotation, which also publishes from the service).
    // See the plan, "Allow linking a persisted free line to a product".
    async linkOrderQuotationProduct({
        order_quotation_product_id,
        product_id,
        current_user_id,
    }: {
        order_quotation_product_id: number;
        product_id: number;
        current_user_id: number;
    }): Promise<OrderQuotation> {
        const line = await this.prisma.order_quotation_products.findFirst({
            where: { id: order_quotation_product_id, active: 1 },
        });
        if (!line) {
            throw new NotFoundException();
        }

        const orderQuotation = await this.getOrderQuotation({
            orderQuotationId: line.order_quotation_id ?? 0,
        });
        if (!orderQuotation) {
            throw new NotFoundException();
        }

        const errors: string[] = [];

        const status = orderQuotation.order_quotation_status_id;
        if (status !== STATUS_BORRADOR && status !== STATUS_ENVIADA) {
            errors.push(
                'Solo se puede vincular un producto en una cotización en Borrador o Enviada',
            );
        }

        if (await this.hasAcceptanceStarted(orderQuotation)) {
            errors.push(
                'La aceptación de la cotización ya inició; no se pueden vincular productos',
            );
        }

        // No relinking: the line must currently be a free line.
        if (line.product_id !== null && line.product_id !== undefined) {
            errors.push('La línea ya tiene un producto vinculado');
        }

        const product = await this.prisma.products.findFirst({
            where: { id: product_id },
        });
        const productIsEligible =
            !!product && product.active === 1 && !product.discontinued;
        if (!productIsEligible) {
            errors.push(
                'El producto no existe, no está activo o está descontinuado',
            );
        }

        // Group-weight compatibility — the same check linked lines already pass.
        if (product && product.active === 1 && !product.discontinued) {
            const currentGroupWeight = product.current_group_weight || 0;
            if (Number(line.group_weight) !== currentGroupWeight) {
                errors.push(
                    `El peso por bulto de la línea (${line.group_weight}) no coincide con el del producto (${currentGroupWeight})`,
                );
            }
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }

        const auditContext = {
            entityName: ActivityEntityName.ORDER_QUOTATION,
            entityId: orderQuotation.id,
            activityType: ActivityTypeName.UPDATE,
            userId: current_user_id,
        };
        const oldCapture = await captureSnapshotSafely(
            auditContext,
            'old_snapshot',
            () =>
                this.getOrderQuotationSnapshot({
                    order_quotation_id: orderQuotation.id,
                }),
        );

        // Set ONLY product_id — every other column is left untouched.
        await this.prisma.order_quotation_products.update({
            data: {
                ...getUpdatedAtProperty(),
                product_id: product_id,
            },
            where: { id: order_quotation_product_id },
        });

        const updated = await this.getOrderQuotation({
            orderQuotationId: orderQuotation.id,
        });

        const newCapture = await captureSnapshotSafely(
            auditContext,
            'new_snapshot',
            () =>
                this.getOrderQuotationSnapshot({
                    order_quotation_id: orderQuotation.id,
                }),
        );

        await this.pubSubService.orderQuotation({
            orderQuotation: updated!,
            type: ActivityTypeName.UPDATE,
            userId: current_user_id,
            oldCapture,
            newCapture,
        });

        return updated!;
    }

    async validateOrderQuotation(
        input: OrderQuotationInput,
        current_user_id: number,
    ): Promise<void> {
        const errors: string[] = [];

        // IsEditable
        {
            if (input.id) {
                const is_editable = await this.isEditable({
                    current_user_id: current_user_id,
                    order_quotation_id: input.id,
                });
                if (!is_editable) {
                    errors.push('Order quotation is not editable');
                }
            }
        }

        // IsOrderCodeOccupied — own sequence, independent of pedido codes.
        {
            const isOrderCodeOccupied = await this.isOrderQuotationCodeOccupied(
                {
                    order_code: input.order_code,
                    order_quotation_id: input && input.id ? input.id : null,
                },
            );

            if (isOrderCodeOccupied) {
                errors.push(
                    `order code is already occupied (${input.order_code})`,
                );
            }
        }

        // AreProductsUnique — ONLY for lines that HAVE a product_id. Two free
        // lines (product_id NULL) are not duplicates of each other.
        {
            const linkedProducts = input.order_quotation_products.filter(
                (product) =>
                    product.product_id !== null &&
                    product.product_id !== undefined,
            );
            linkedProducts.forEach(({ product_id: product_id_1 }) => {
                let count = 0;
                linkedProducts.forEach(({ product_id: product_id_2 }) => {
                    if (product_id_1 === product_id_2) {
                        count = count + 1;
                    }
                });
                if (count >= 2) {
                    errors.push(
                        `product is not unique (product_id: ${product_id_1})`,
                    );
                }
            });
        }

        // DoesCurrentGroupWeightMatchGroupWeight (linked lines only) +
        // IsProductGroupCorrectlyCalculated (every line — groups * group_weight
        // === kilos still validates on a free line, since group_weight is typed
        // by hand). NO catalog/price validation: a cotización is free-priced by
        // design, so AreProductsInAccountCatalog is deliberately NOT ported.
        {
            for await (const {
                product_id,
                kilos,
                group_weight: groupWeight,
                groups,
            } of input.order_quotation_products) {
                if (product_id) {
                    const product = await this.prisma.products.findUnique({
                        where: {
                            id: product_id,
                        },
                    });

                    if (
                        !product ||
                        product.active !== 1 ||
                        product.discontinued
                    ) {
                        errors.push(
                            `product must be active and not discontinued (product_id: ${product_id})`,
                        );
                    } else {
                        const currentGroupWeight =
                            product.current_group_weight || 0;

                        if (
                            groupWeight !== null &&
                            Number(groupWeight) !== currentGroupWeight
                        ) {
                            errors.push(
                                `current group weight doesnt match group weight (group_weight: ${groupWeight}, current_group_weight: ${currentGroupWeight})`,
                            );
                        }
                    }
                }

                // No group dimension on this line (kilo-priced): nothing to
                // check. Applies to free and linked lines alike.
                if (groupWeight === null || groupWeight === 0 || !groupWeight) {
                    continue;
                }

                if (groups * groupWeight !== kilos) {
                    errors.push(
                        `kilos incorrectly calculated (product_id (${product_id}) groups * group_weight !== kilos (${groups} * ${groupWeight} !== ${kilos}))`,
                    );
                }
            }
        }

        // ProductsMinSize
        {
            if (input.order_quotation_products.length === 0) {
                errors.push(
                    `Products min size has to be greater or equal than 1`,
                );
            }
        }

        // Free lines must carry a non-empty proposed_description — that text is
        // the only description a line without a product has, and it is what
        // blocks acceptance later (Producción must create the product first).
        {
            input.order_quotation_products.forEach(
                (orderQuotationProduct, index) => {
                    const hasProduct =
                        orderQuotationProduct.product_id !== null &&
                        orderQuotationProduct.product_id !== undefined;
                    const hasDescription =
                        !!orderQuotationProduct.proposed_description &&
                        orderQuotationProduct.proposed_description.trim() !==
                            '';
                    if (!hasProduct && !hasDescription) {
                        errors.push(
                            `free line (index: ${index}) must have a proposed description`,
                        );
                    }
                },
            );
        }

        // IsAccountClient — same rule as a pedido. No prospect concept.
        {
            if (input.account_id) {
                const account = await this.prisma.accounts.findFirst({
                    where: {
                        id: input.account_id,
                    },
                });

                if (!account || !account.is_client) {
                    errors.push('Account is not a client');
                }
            } else {
                errors.push('Account is not a client');
            }
        }

        // Price rule: EXACTLY ONE of kilo_price / group_price greater than zero,
        // the other exactly zero. Both zero, both positive, and negatives are all
        // invalid. Shared with the frontend and the acceptance preview through
        // OrderQuotationsService.isLinePriceValid. See "Make price validation
        // consistent".
        {
            input.order_quotation_products.forEach(
                (orderQuotationProduct, index) => {
                    if (
                        !OrderQuotationsService.isLinePriceValid(
                            orderQuotationProduct.kilo_price,
                            orderQuotationProduct.group_price,
                        )
                    ) {
                        errors.push(
                            `Exactly one of kilo price and group price must be greater than zero, the other zero (index: ${index}, product id: ${orderQuotationProduct.product_id}, kilo price: ${orderQuotationProduct.kilo_price}, group price: ${orderQuotationProduct.group_price})`,
                        );
                    }
                },
            );
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }

    async deleteOrderQuotation({
        order_quotation_id,
        current_user_id,
    }: {
        order_quotation_id: number;
        current_user_id: number;
    }): Promise<boolean> {
        const orderQuotation = await this.prisma.order_quotations.findFirst({
            where: {
                id: order_quotation_id,
                active: 1,
            },
        });

        if (!orderQuotation) {
            throw new NotFoundException();
        }

        const isDeletable = await this.isDeletable({
            order_quotation_id,
            current_user_id,
        });

        if (!isDeletable) {
            const { order_requests_count } = await this.getDependenciesCount({
                order_quotation_id,
            });

            const errors: string[] = [];
            if (order_requests_count > 0) {
                errors.push(`order requests count is ${order_requests_count}`);
            } else {
                errors.push('Order quotation is not deletable');
            }

            throw new BadRequestException(errors);
        }

        await this.prisma.order_quotation_products.updateMany({
            data: {
                ...getUpdatedAtProperty(),
                active: -1,
            },
            where: {
                order_quotation_id: order_quotation_id,
            },
        });

        await this.prisma.order_quotations.updateMany({
            data: {
                ...getUpdatedAtProperty(),
                ...getUpdatedByProperty(current_user_id),
                active: -1,
            },
            where: {
                id: order_quotation_id,
            },
        });

        return true;
    }

    async getAccount({
        account_id,
    }: {
        account_id?: number | null;
    }): Promise<Account | null> {
        if (!account_id) {
            return null;
        }

        return this.prisma.accounts.findFirst({
            where: {
                id: account_id,
            },
        });
    }

    async getOrderQuotationStatus({
        order_quotation_status_id,
    }: {
        order_quotation_status_id?: number | null;
    }): Promise<OrderQuotationStatus | null> {
        if (!order_quotation_status_id) {
            return null;
        }
        return this.prisma.order_quotation_statuses.findFirst({
            where: {
                id: order_quotation_status_id,
            },
        });
    }

    // The linked product of a quotation line. NULL on a free line (product_id
    // NULL) — that is the one place a line has no product. Backs the
    // OrderQuotationProduct.product ResolveField, mirroring the pedido side.
    async getProduct({
        product_id,
    }: {
        product_id?: number | null;
    }): Promise<Product | null> {
        if (!product_id) {
            return null;
        }
        return this.prisma.products.findFirst({
            where: {
                id: product_id,
            },
        });
    }

    // Has a pedido row EVER been linked to this quotation? Deliberately
    // UNFILTERED by active: a soft-deleted pedido still counts as linked. This is
    // NOT the pedido-completion signal — it is only used to detect the DIAGNOSTIC
    // half-state (a row exists but order_request_completed_at was never stamped)
    // and to guard against creating a second pedido. Completion is the stored
    // order_request_completed_at, never the mere existence of this row. See the
    // plan, "The pedido completion marker".
    async hasLinkedOrderRequest({
        order_quotation_id,
    }: {
        order_quotation_id: number;
    }): Promise<boolean> {
        const created = await this.prisma.order_requests.findFirst({
            where: { order_quotation_id },
        });
        return created !== null;
    }

    // The Pedido step's diagnostic tri-state. COMPLETED is authoritative — the
    // stored order_request_completed_at. A linked pedido WITHOUT that stamp is
    // CREATED_INCOMPLETE: a software fault interrupted acceptance after the row
    // was created but before completion was recorded. The app never creates a
    // second pedido, inspects its lines, or repairs it — an engineer diagnoses
    // the logs and DB by hand. See the plan, "The pedido completion marker".
    async getPedidoStepState(
        orderQuotation: OrderQuotation,
    ): Promise<OrderQuotationPedidoStepState> {
        if (orderQuotation.order_request_completed_at) {
            return OrderQuotationPedidoStepState.COMPLETED;
        }
        const linked = await this.hasLinkedOrderRequest({
            order_quotation_id: orderQuotation.id,
        });
        return linked
            ? OrderQuotationPedidoStepState.CREATED_INCOMPLETE
            : OrderQuotationPedidoStepState.NOT_CREATED;
    }

    // Acceptance has STARTED when any one-time acceptance side effect has landed:
    // the catalog was written, a pedido is linked (even a soft-deleted or
    // incomplete one), the pedido completion was stamped, or the status is
    // already Aceptada. Once started, every ordinary write path is locked and
    // only the acceptance flow may finish the remaining steps. See the plan,
    // "Lock quotation changes after acceptance starts".
    async hasAcceptanceStarted(
        orderQuotation: OrderQuotation,
    ): Promise<boolean> {
        if (orderQuotation.account_products_updated_at) return true;
        if (orderQuotation.order_request_completed_at) return true;
        if (orderQuotation.order_quotation_status_id === STATUS_ACEPTADA)
            return true;
        return this.hasLinkedOrderRequest({
            order_quotation_id: orderQuotation.id,
        });
    }

    // The three acceptance step-states plus the roll-up, for the acceptance
    // panel and the diagnostics tab. Catálogo is the STORED catalog stamp; Pedido
    // is the STORED completion stamp (order_request_completed_at — NOT the mere
    // existence of a linked pedido); Estado reads the status. See the plan, "The
    // pedido completion marker" and "One stored column, two derived".
    async getAcceptanceSteps(orderQuotation: OrderQuotation): Promise<{
        catalog_step_done: boolean;
        order_request_step_done: boolean;
        status_step_done: boolean;
        acceptance_complete: boolean;
    }> {
        const catalog_step_done =
            orderQuotation.account_products_updated_at !== null &&
            orderQuotation.account_products_updated_at !== undefined;
        // Pedido completion is the STORED stamp, never the linked-row existence:
        // a CREATED_INCOMPLETE half-state must read "not done".
        const order_request_step_done =
            orderQuotation.order_request_completed_at !== null &&
            orderQuotation.order_request_completed_at !== undefined;
        const status_step_done =
            orderQuotation.order_quotation_status_id === STATUS_ACEPTADA;

        return {
            catalog_step_done,
            order_request_step_done,
            status_step_done,
            acceptance_complete:
                catalog_step_done &&
                order_request_step_done &&
                status_step_done,
        };
    }

    // The LIVE pedido this quotation converted into, if any — the UI's navigation
    // target. Different query from the step lookup above: this one filters
    // active: 1 (a soft-deleted pedido is not something to link to), that one does
    // not. Same column, two filters, two purposes — do not collapse them.
    async getConvertedOrderRequest({
        order_quotation_id,
    }: {
        order_quotation_id: number;
    }): Promise<OrderRequest | null> {
        return this.prisma.order_requests.findFirst({
            where: { order_quotation_id, active: 1 },
        });
    }

    // Delete dependency: count LIVE pedidos converted from this quotation,
    // mirroring deleteOrderRequest's order_sales_count check (which filters
    // active: 1). A converted quotation cannot be deleted out from under its
    // pedido.
    async getDependenciesCount({
        order_quotation_id,
    }: {
        order_quotation_id: number;
    }): Promise<{ order_requests_count: number }> {
        const {
            _count: { id: orderRequestCount },
        } = await this.prisma.order_requests.aggregate({
            _count: { id: true },
            where: {
                order_quotation_id: order_quotation_id,
                active: 1,
            },
        });

        return { order_requests_count: orderRequestCount };
    }

    async isDeletable({
        order_quotation_id,
        current_user_id,
    }: {
        order_quotation_id: number;
        current_user_id: number;
    }): Promise<boolean> {
        const { order_requests_count } = await this.getDependenciesCount({
            order_quotation_id,
        });

        const is_editable = await this.isEditable({
            current_user_id,
            order_quotation_id,
        });

        return order_requests_count === 0 && is_editable;
    }

    async isEditable({
        order_quotation_id,
    }: {
        order_quotation_id: number;
        current_user_id: number;
    }): Promise<boolean> {
        const previousOrderQuotation = await this.getOrderQuotation({
            orderQuotationId: order_quotation_id,
        });

        // New (unsaved) quotations have no status yet — allow.
        if (!previousOrderQuotation) {
            return true;
        }

        // Editable only while in Borrador, for ALL roles. To edit a sent
        // quotation, an admin first moves it back to Borrador via
        // updateOrderQuotationStatus. An accepted quotation is terminal and stays
        // read-only.
        if (
            previousOrderQuotation.order_quotation_status_id !== STATUS_BORRADOR
        ) {
            return false;
        }

        // Belt-and-suspenders lock: once acceptance has started (catalog written,
        // a pedido linked, completion stamped, or Aceptada) the quotation is
        // read-only even if it is somehow still a Borrador — only the acceptance
        // flow may finish the remaining steps. See the plan, "Lock quotation
        // changes after acceptance starts". This also propagates to isDeletable,
        // which composes isEditable.
        const acceptanceStarted = await this.hasAcceptanceStarted(
            previousOrderQuotation,
        );
        return !acceptanceStarted;
    }

    // The acceptance preview (step 9): what accepting will do to the client's
    // catalog, plus the blocking reasons behind a disabled Aceptar button.
    // Read-only — writes nothing.
    async getOrderQuotationCatalogChanges({
        order_quotation_id,
    }: {
        order_quotation_id: number;
    }): Promise<OrderQuotationCatalogPreview> {
        const orderQuotation = await this.getOrderQuotation({
            orderQuotationId: order_quotation_id,
        });

        if (!orderQuotation) {
            throw new NotFoundException();
        }

        const blocking_reasons = await this.getAcceptanceBlockingReasons({
            orderQuotation,
        });

        const lines = await this.getOrderQuotationProducts({
            order_quotation_id,
        });

        // Only linked lines are catalog changes; free lines are blocking reasons.
        const linkedLines = lines.filter((line) => !!line.product_id);

        const catalogRows = orderQuotation.account_id
            ? await this.prisma.account_products.findMany({
                  where: { account_id: orderQuotation.account_id, active: 1 },
              })
            : [];
        const catalogByProductId = new Map(
            catalogRows.map((row) => [row.product_id, row]),
        );

        const changes: OrderQuotationCatalogChange[] = [];
        for (const line of linkedLines) {
            const product = await this.prisma.products.findUnique({
                where: { id: line.product_id! },
            });
            const current = catalogByProductId.get(line.product_id ?? null);

            let action: OrderQuotationCatalogAction;
            if (!current) {
                action = OrderQuotationCatalogAction.AGREGAR;
            } else if (
                Number(current.kilo_price) === Number(line.kilo_price) &&
                Number(current.group_price) === Number(line.group_price)
            ) {
                action = OrderQuotationCatalogAction.SIN_CAMBIO;
            } else {
                action = OrderQuotationCatalogAction.ACTUALIZAR;
            }

            changes.push({
                product_id: line.product_id!,
                description: product?.external_description || '',
                current_kilo_price: current ? Number(current.kilo_price) : null,
                current_group_price: current
                    ? Number(current.group_price)
                    : null,
                proposed_kilo_price: Number(line.kilo_price),
                proposed_group_price: Number(line.group_price),
                action,
            });
        }

        return {
            changes,
            blocking_reasons,
            is_acceptable: blocking_reasons.length === 0,
        };
    }

    // Acceptance — ADMIN only (gated at the resolver). Runs three steps in the
    // FORCED order catálogo → pedido → estado, SKIPPING any already done, so a
    // partially-applied acceptance can be resumed by pressing the button again.
    //
    // This is the one path in the quotations module that publishes activities
    // from the service rather than the resolver. It has to: the three audit
    // envelopes wrap INTERIOR, CONDITIONAL writes (a resume may run only the
    // status step), which a resolver cannot bracket. Each envelope still uses the
    // same captureSnapshotSafely guard the resolvers use.
    //
    // Order is forced, not chosen: upsertOrderRequest validates every line's
    // price against account_products, so the pedido cannot be created before the
    // catalog write; and the status lands LAST so that Aceptada means "all three
    // done". Because Aceptada is written last, a partial acceptance is by
    // definition not accepted, so resumability only ever operates on a
    // non-terminal quotation — the terminal rule and the resume rule never
    // overlap. See the plan, "Acceptance is three steps" and "Acceptance is
    // terminal".
    async acceptOrderQuotation({
        order_quotation_id,
        current_user_id,
    }: {
        order_quotation_id: number;
        current_user_id: number;
    }): Promise<OrderQuotation> {
        const orderQuotation = await this.getOrderQuotation({
            orderQuotationId: order_quotation_id,
        });

        if (!orderQuotation) {
            throw new NotFoundException();
        }

        // Terminal: an accepted quotation never writes the catalog or touches
        // order_requests again, through any path. Because status is written last,
        // "already Aceptada" is exactly the all-three-done case.
        if (orderQuotation.order_quotation_status_id === STATUS_ACEPTADA) {
            throw new BadRequestException([
                'La cotización ya fue aceptada (no se puede volver a aceptar)',
            ]);
        }

        // Every other refusal — declined, expired, not a client, free lines
        // (named). Same predicate as the preview and isAcceptable.
        const blocking_reasons = await this.getAcceptanceBlockingReasons({
            orderQuotation,
        });
        if (blocking_reasons.length > 0) {
            throw new BadRequestException(blocking_reasons);
        }

        // ── Step 1 · Catálogo ──────────────────────────────────────────────
        // Driven by the STORED stamp, never by comparing against the current
        // catalog: a resume must skip the destructive write if it already ran,
        // or it would silently revert a manual price edit made in between. See
        // the plan, "One stored column, two derived".
        if (!orderQuotation.account_products_updated_at) {
            await this.writeAcceptedCatalog({
                orderQuotation,
                current_user_id,
            });
        }

        // ── Step 2 · Pedido ────────────────────────────────────────────────
        // Completion is the STORED order_request_completed_at, set ONLY after
        // upsertOrderRequest returns. Skipped when it is already set.
        //
        // The CREATED_INCOMPLETE half-state (a pedido row exists but the stamp is
        // NULL) is already a blocking reason above, so this point is never reached
        // with a linked-but-incomplete pedido — a resume can therefore never mint
        // a second pedido, and the app never inspects or repairs the existing one.
        // See the plan, "The pedido completion marker".
        if (!orderQuotation.order_request_completed_at) {
            await this.createAcceptedOrderRequest({
                orderQuotation,
                current_user_id,
            });
        }

        // ── Step 3 · Estado ────────────────────────────────────────────────
        // Written LAST. Reached only on a non-terminal quotation (guarded
        // above), so it always needs to run here.
        return this.markAccepted({ orderQuotation, current_user_id });
    }

    // Step 1 wrapper — the quotations-side AUDITED catalog write. Sends the
    // client's COMPLETE MERGED catalog (every existing account_products row plus
    // the quoted new/updated ones) because syncAccountProducts soft-deletes any
    // row NOT in the input; account_contacts and account_resources are read and
    // passed through UNCHANGED for the same reason. Reproduces the account audit
    // envelope around AccountsService.upsertAccount (whose own envelope lives in
    // the accounts RESOLVER, so a direct service call would log nothing), with a
    // title that names the cotización for provenance.
    //
    // NOTE: this envelope is a second copy of the account audit shape (the first
    // is in accounts.resolver.ts). A future change to the account audit shape has
    // to touch both.
    private async writeAcceptedCatalog({
        orderQuotation,
        current_user_id,
    }: {
        orderQuotation: OrderQuotation;
        current_user_id: number;
    }): Promise<void> {
        const account_id = orderQuotation.account_id!;

        const input = await this.buildMergedAccountInput({
            account_id,
            orderQuotation,
        });

        const auditContext = {
            entityName: ActivityEntityName.ACCOUNT,
            entityId: account_id,
            activityType: ActivityTypeName.UPDATE,
            userId: current_user_id,
        };
        const oldCapture = await captureSnapshotSafely(
            auditContext,
            'old_snapshot',
            () => this.accountsService.getAccountSnapshot({ account_id }),
        );

        const account = await this.accountsService.upsertAccount(input, {
            current_user_id,
        });

        // Stamp the STORED catalog-write marker on the quotation — the record
        // that this one-time destructive write happened. Drives the resume skip.
        await this.prisma.order_quotations.update({
            data: {
                ...getUpdatedAtProperty(),
                account_products_updated_at: new Date(),
            },
            where: { id: orderQuotation.id },
        });

        const newCapture = await captureSnapshotSafely(
            auditContext,
            'new_snapshot',
            () => this.accountsService.getAccountSnapshot({ account_id }),
        );

        await this.pubSubService.account({
            account,
            type: ActivityTypeName.UPDATE,
            userId: current_user_id,
            oldCapture,
            newCapture,
            // Provenance in the title — how "why did these prices change that
            // day?" is answered, without a schema change. See the plan,
            // "Provenance".
            title: () =>
                `${account.abbreviation || account.name} · cotización #${
                    orderQuotation.order_code
                }`,
        });
    }

    // Builds the COMPLETE merged AccountUpsertInput: all existing scalar fields
    // unchanged, all contacts and resources unchanged, and the product catalog =
    // existing rows with quoted prices applied (ACTUALIZAR) plus quoted products
    // absent from the catalog (AGREGAR). group_weight is re-derived from the
    // product by syncAccountProducts, so what is sent here is irrelevant.
    private async buildMergedAccountInput({
        account_id,
        orderQuotation,
    }: {
        account_id: number;
        orderQuotation: OrderQuotation;
    }): Promise<AccountUpsertInput> {
        const account = await this.accountsService.getAccount({ account_id });
        if (!account) {
            throw new NotFoundException();
        }

        const existingContacts: AccountContact[] =
            await this.accountsService.getAccountContacts({ account_id });
        const existingResources: AccountResource[] =
            await this.accountsService.getAccountResources({ account_id });
        const existingProducts: AccountProduct[] =
            await this.accountsService.getAccountProducts({ account_id });

        const lines = await this.getOrderQuotationProducts({
            order_quotation_id: orderQuotation.id,
        });
        const linkedLines = lines.filter((line) => !!line.product_id);

        const mergedProducts: AccountProductInput[] = existingProducts.map(
            (row) => ({
                id: row.id,
                product_id: row.product_id,
                kilo_price: row.kilo_price,
                group_price: row.group_price,
                group_weight: row.group_weight,
            }),
        );
        const mergedByProductId = new Map(
            mergedProducts.map((row) => [row.product_id, row]),
        );

        for (const line of linkedLines) {
            const existing = mergedByProductId.get(line.product_id ?? null);
            if (existing) {
                existing.kilo_price = line.kilo_price;
                existing.group_price = line.group_price;
            } else {
                // id: null — the form's "new row" signal. vennDiagram THROWS on
                // an undefined index key (an omitted id), so this must be an
                // explicit null, not a missing field.
                const added: AccountProductInput = {
                    id: null,
                    product_id: line.product_id,
                    kilo_price: line.kilo_price,
                    group_price: line.group_price,
                    group_weight: line.group_weight,
                };
                mergedProducts.push(added);
                mergedByProductId.set(line.product_id ?? null, added);
            }
        }

        return {
            id: account.id,
            name: account.name,
            abbreviation: account.abbreviation,
            // Every scalar the account carries must be echoed back unchanged, or
            // upsertAccount rewrites it. rfc/address are the two new general
            // columns; the two reconciliation_only flags were added to AccountBase
            // after this builder was first written and must be passed through too.
            rfc: account.rfc,
            address: account.address,
            is_supplier: account.is_supplier,
            requires_order_request: account.requires_order_request,
            monitor_supplier_expenses: account.monitor_supplier_expenses,
            is_client: account.is_client,
            resource_id: account.resource_id,
            client_credit_days: account.client_credit_days,
            supplier_credit_days: account.supplier_credit_days,
            client_require_credit_note: account.client_require_credit_note,
            client_require_supplement: account.client_require_supplement,
            client_requires_invoice_code: account.client_requires_invoice_code,
            client_requires_tax: account.client_requires_tax,
            supplier_require_supplement: account.supplier_require_supplement,
            supplier_requires_external_code:
                account.supplier_requires_external_code,
            supplier_requires_tax: account.supplier_requires_tax,
            supplier_recurring_expenses: account.supplier_recurring_expenses,
            client_automatic_tax_calculation:
                account.client_automatic_tax_calculation,
            client_reconciliation_only: account.client_reconciliation_only,
            supplier_reconciliation_only: account.supplier_reconciliation_only,
            supplier_is_draft: account.supplier_is_draft,
            account_contacts: existingContacts.map((contact) => ({
                id: contact.id,
                first_name: contact.first_name,
                last_name: contact.last_name,
                email: contact.email,
                cellphone: contact.cellphone,
            })),
            account_products: mergedProducts,
            account_resources: existingResources.map((resource) => ({
                id: resource.id,
                resource_id: resource.resource_id,
                unit_price: resource.unit_price,
                notes: resource.notes,
            })),
        };
    }

    // Step 2 wrapper — creates the pedido through the VALIDATED upsert path so a
    // cotización can never mint an order_request the pedido form itself would
    // refuse. Its own order_code is generated (never copied from the cotización),
    // and the order_quotation_id link is passed as the create-only second arg, so
    // the pedido never exists unlinked and the link is immutable by construction.
    // Builds the pedido audit envelope (a create), since upsertOrderRequest's own
    // activity is published in the order-requests RESOLVER.
    //
    // NON-TRANSACTIONAL by design: the pedido, its lines, the completion stamp
    // and the audit are separate writes, not wrapped in a transaction (see the
    // plan, "The pedido completion marker"). order_request_completed_at is the
    // AUTHORITATIVE completion signal and is stamped ONLY after upsertOrderRequest
    // returns from creating the pedido and all its lines. If the process dies
    // between the pedido write and this stamp, the quotation is left in the
    // CREATED_INCOMPLETE half-state: an engineer diagnoses it and the app never
    // creates a second pedido or repairs the first.
    private async createAcceptedOrderRequest({
        orderQuotation,
        current_user_id,
    }: {
        orderQuotation: OrderQuotation;
        current_user_id: number;
    }): Promise<void> {
        const lines = await this.getOrderQuotationProducts({
            order_quotation_id: orderQuotation.id,
        });
        const linkedLines = lines.filter((line) => !!line.product_id);

        const maxOrderCode =
            await this.orderRequestsService.getOrderRequestMaxOrderCode();

        const input: OrderRequestInput = {
            order_code: maxOrderCode + 1,
            // Acceptance date — the pedido is placed now, not when it was quoted.
            date: new Date(),
            estimated_delivery_date: orderQuotation.estimated_delivery_date,
            account_id: orderQuotation.account_id,
            notes: orderQuotation.notes,
            order_request_products: linkedLines.map((line) => ({
                // id: null — new pedido line. upsertOrderRequest runs these
                // through vennDiagram, which THROWS on an undefined index key.
                id: null,
                product_id: line.product_id,
                kilos: line.kilos,
                groups: line.groups,
                kilo_price: line.kilo_price,
                group_price: line.group_price,
                group_weight: line.group_weight,
            })),
        };

        const orderRequest = await this.orderRequestsService.upsertOrderRequest(
            {
                input,
                current_user_id,
            },
            { order_quotation_id: orderQuotation.id },
        );

        // Stamp the AUTHORITATIVE completion marker — ONLY now that
        // upsertOrderRequest has returned from creating the pedido and all its
        // lines. This is the single signal the Pedido step reads; completion is
        // never inferred by comparing the quotation with the pedido. See the
        // plan, "The pedido completion marker".
        await this.prisma.order_quotations.update({
            data: {
                ...getUpdatedAtProperty(),
                order_request_completed_at: new Date(),
            },
            where: { id: orderQuotation.id },
        });

        const auditContext = {
            entityName: ActivityEntityName.ORDER_REQUEST,
            entityId: orderRequest.id,
            activityType: ActivityTypeName.CREATE,
            userId: current_user_id,
        };
        const newCapture = await captureSnapshotSafely(
            auditContext,
            'new_snapshot',
            () =>
                this.orderRequestsService.getOrderRequestSnapshot({
                    order_request_id: orderRequest.id,
                }),
        );

        await this.pubSubService.orderRequest({
            orderRequest,
            type: ActivityTypeName.CREATE,
            userId: current_user_id,
            oldCapture: INTENTIONALLY_ABSENT,
            newCapture,
        });
    }

    // Step 3 — mark Aceptada, LAST, with its own audit envelope.
    private async markAccepted({
        orderQuotation,
        current_user_id,
    }: {
        orderQuotation: OrderQuotation;
        current_user_id: number;
    }): Promise<OrderQuotation> {
        const auditContext = {
            entityName: ActivityEntityName.ORDER_QUOTATION,
            entityId: orderQuotation.id,
            activityType: ActivityTypeName.UPDATE,
            userId: current_user_id,
        };
        const oldCapture = await captureSnapshotSafely(
            auditContext,
            'old_snapshot',
            () =>
                this.getOrderQuotationSnapshot({
                    order_quotation_id: orderQuotation.id,
                }),
        );

        const accepted = await this.prisma.order_quotations.update({
            data: {
                ...getUpdatedAtProperty(),
                ...getUpdatedByProperty(current_user_id),
                order_quotation_status_id: STATUS_ACEPTADA,
            },
            where: { id: orderQuotation.id },
        });

        const newCapture = await captureSnapshotSafely(
            auditContext,
            'new_snapshot',
            () =>
                this.getOrderQuotationSnapshot({
                    order_quotation_id: orderQuotation.id,
                }),
        );

        await this.pubSubService.orderQuotation({
            orderQuotation: accepted,
            type: ActivityTypeName.UPDATE,
            userId: current_user_id,
            oldCapture,
            newCapture,
        });

        return accepted;
    }
}
