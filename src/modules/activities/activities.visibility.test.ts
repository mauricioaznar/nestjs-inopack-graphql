import { canSeeActivity } from './activities.resolver';
import { ActivityEntityName } from '../../common/dto/entities';
import { RoleId } from '../../common/dto/entities/auth/role.dto';

// Pure-function coverage of the live-feed authorization. The subscription's
// per-event `filter` delegates to `canSeeActivity`, so pinning the mapping here
// is the cheapest place to prove strict per-module isolation — no socket needed.
const user = (...role_ids: RoleId[]) => ({
    id: 1,
    email: 'u@email.com',
    role_ids,
});

describe('canSeeActivity', () => {
    describe('global roles', () => {
        it('Super sees every entity, including user-management', () => {
            for (const entity of Object.values(ActivityEntityName)) {
                expect(canSeeActivity(user(RoleId.SUPER), entity)).toBe(true);
            }
        });

        it('General and Asistente General see every domain but NOT users', () => {
            for (const role of [RoleId.ADMIN, RoleId.GUEST]) {
                expect(
                    canSeeActivity(user(role), ActivityEntityName.EXPENSE),
                ).toBe(true);
                expect(
                    canSeeActivity(user(role), ActivityEntityName.ORDER_SALE),
                ).toBe(true);
                expect(
                    canSeeActivity(user(role), ActivityEntityName.PRODUCT),
                ).toBe(true);
                // User-management activity is super-only.
                expect(
                    canSeeActivity(user(role), ActivityEntityName.USER),
                ).toBe(false);
            }
        });
    });

    describe('strict per-module isolation', () => {
        it('Sales sees sales entities only', () => {
            const sales = user(RoleId.SALES);
            expect(canSeeActivity(sales, ActivityEntityName.ORDER_SALE)).toBe(
                true,
            );
            expect(canSeeActivity(sales, ActivityEntityName.ACCOUNT)).toBe(true);
            // The bleed the fix targets: Ventas must not receive Gastos events.
            expect(canSeeActivity(sales, ActivityEntityName.EXPENSE)).toBe(
                false,
            );
            expect(canSeeActivity(sales, ActivityEntityName.PRODUCT)).toBe(
                false,
            );
        });

        it('Expenses sees expense entities only, including transfers and resources', () => {
            const expenses = user(RoleId.EXPENSES);
            expect(canSeeActivity(expenses, ActivityEntityName.EXPENSE)).toBe(
                true,
            );
            expect(canSeeActivity(expenses, ActivityEntityName.TRANSFER)).toBe(
                true,
            );
            expect(canSeeActivity(expenses, ActivityEntityName.RESOURCE)).toBe(
                true,
            );
            // The reverse bleed: Gastos must not receive Ventas events.
            expect(canSeeActivity(expenses, ActivityEntityName.ORDER_SALE)).toBe(
                false,
            );
        });

        it('Production sees production entities only, including machines', () => {
            const production = user(RoleId.PRODUCTION);
            expect(
                canSeeActivity(production, ActivityEntityName.ORDER_PRODUCTION),
            ).toBe(true);
            expect(canSeeActivity(production, ActivityEntityName.MACHINE)).toBe(
                true,
            );
            expect(canSeeActivity(production, ActivityEntityName.EXPENSE)).toBe(
                false,
            );
        });

        it('assistant roles inherit their module and nothing else', () => {
            expect(
                canSeeActivity(
                    user(RoleId.SALES_ASSISTANT),
                    ActivityEntityName.ORDER_QUOTATION,
                ),
            ).toBe(true);
            expect(
                canSeeActivity(
                    user(RoleId.EXPENSES_ASSISTANT),
                    ActivityEntityName.ORDER_SALE,
                ),
            ).toBe(false);
        });
    });

    describe('shared and edge cases', () => {
        it('employees reach both Production and HR', () => {
            expect(
                canSeeActivity(
                    user(RoleId.PRODUCTION),
                    ActivityEntityName.EMPLOYEE,
                ),
            ).toBe(true);
            expect(
                canSeeActivity(
                    user(RoleId.HUMAN_RESOURCES),
                    ActivityEntityName.EMPLOYEE,
                ),
            ).toBe(true);
        });

        it('HR sees employees but not other modules', () => {
            const hr = user(RoleId.HUMAN_RESOURCES);
            expect(canSeeActivity(hr, ActivityEntityName.EMPLOYEE)).toBe(true);
            expect(canSeeActivity(hr, ActivityEntityName.EXPENSE)).toBe(false);
            expect(canSeeActivity(hr, ActivityEntityName.ORDER_SALE)).toBe(
                false,
            );
        });

        it('an absent user (no authenticated socket) sees nothing', () => {
            expect(
                canSeeActivity(undefined, ActivityEntityName.ORDER_SALE),
            ).toBe(false);
        });

        it('a role with no mapped module sees nothing', () => {
            // A business role holding none of the domain roles falls through to
            // the empty allow-set and is denied — fail closed.
            expect(
                canSeeActivity(user(999 as RoleId), ActivityEntityName.EXPENSE),
            ).toBe(false);
        });
    });
});
