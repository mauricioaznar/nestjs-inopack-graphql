import {
    Args,
    Context,
    Int,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
} from '@nestjs/graphql';
import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { ProductionPlansService } from './production-plans.service';
import {
    ActivityTypeName,
    Branch,
    GetProductionPlanActualsArgs,
    GetProductionPlanArgs,
    GetProductionPlansArgs,
    Machine,
    Product,
    ProductionPlan,
    ProductionPlanActual,
    ProductionPlanRow,
    ProductionPlanRowProduct,
    ProductionPlanUpsertInput,
    User,
} from '../../../common/dto/entities';
import { Employee } from '../../../common/dto/entities/production/employee.dto';
import {
    createBatchLoader,
    getRequestLoader,
    LoaderContext,
} from '../../../common/helpers';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RolesDecorator } from '../../auth/decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';

@Resolver(() => ProductionPlan)
@UseGuards(GqlAuthGuard)
@Injectable()
export class ProductionPlansResolver {
    constructor(
        private service: ProductionPlansService,
        private pubSubService: PubSubService,
    ) {}

    @Query(() => ProductionPlan, { nullable: true })
    @RolesDecorator(RoleId.PRODUCTION, RoleId.PRODUCTION_ASSISTANT)
    async getProductionPlan(
        @Args() getProductionPlanArgs: GetProductionPlanArgs,
    ): Promise<ProductionPlan | null> {
        return this.service.getProductionPlan({
            date: getProductionPlanArgs.date,
            shift: getProductionPlanArgs.shift,
            branch_id: getProductionPlanArgs.branch_id,
        });
    }

    @Query(() => [ProductionPlanActual])
    @RolesDecorator(RoleId.PRODUCTION, RoleId.PRODUCTION_ASSISTANT)
    async getProductionPlanActuals(
        @Args() args: GetProductionPlanActualsArgs,
    ): Promise<ProductionPlanActual[]> {
        return this.service.getProductionPlanActuals({
            date: args.date,
            shift: args.shift,
            branch_id: args.branch_id,
        });
    }

    @Query(() => [Int])
    @RolesDecorator(RoleId.PRODUCTION, RoleId.PRODUCTION_ASSISTANT)
    async getMachineProducedProductIds(
        @Args('machineId', { type: () => Int }) machineId: number,
    ): Promise<number[]> {
        return this.service.getMachineProducedProductIds({
            machine_id: machineId,
        });
    }

    @Query(() => [ProductionPlan])
    @RolesDecorator(RoleId.PRODUCTION, RoleId.PRODUCTION_ASSISTANT)
    async getProductionPlans(
        @Args() getProductionPlansArgs: GetProductionPlansArgs,
    ): Promise<ProductionPlan[]> {
        return this.service.getProductionPlans({
            start_date: getProductionPlansArgs.start_date,
            end_date: getProductionPlansArgs.end_date,
        });
    }

    @Mutation(() => ProductionPlan)
    @RolesDecorator(RoleId.PRODUCTION)
    async upsertProductionPlan(
        @Args('ProductionPlanUpsertInput') input: ProductionPlanUpsertInput,
        @CurrentUser() currentUser: User,
    ): Promise<ProductionPlan> {
        const productionPlan = await this.service.upsertProductionPlan(input);
        await this.pubSubService.productionPlan({
            productionPlan,
            type: !input.id
                ? ActivityTypeName.CREATE
                : ActivityTypeName.UPDATE,
            userId: currentUser.id,
        });
        return productionPlan;
    }

    @Mutation(() => Boolean)
    @RolesDecorator(RoleId.PRODUCTION)
    async deleteProductionPlan(
        @Args('ProductionPlanId', { type: () => Int })
        productionPlanId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        const productionPlan = await this.service.getProductionPlanById({
            production_plan_id: productionPlanId,
        });
        if (!productionPlan) throw new NotFoundException();
        await this.service.deleteProductionPlan({
            production_plan_id: productionPlanId,
        });
        await this.pubSubService.productionPlan({
            productionPlan,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
        });
        return true;
    }

    @ResolveField(() => Branch, { nullable: true })
    async branch(
        @Parent() productionPlan: ProductionPlan,
    ): Promise<Branch | null> {
        return this.service.getBranch({
            branch_id: productionPlan.branch_id,
        });
    }

    @ResolveField(() => [ProductionPlanRow])
    async rows(
        @Parent() productionPlan: ProductionPlan,
    ): Promise<ProductionPlanRow[]> {
        return this.service.getProductionPlanRows({
            production_plan_id: productionPlan.id,
        });
    }
}

@Resolver(() => ProductionPlanRow)
@UseGuards(GqlAuthGuard)
@Injectable()
export class ProductionPlanRowsResolver {
    constructor(private service: ProductionPlansService) {}

    @ResolveField(() => Machine, { nullable: true })
    async machine(
        @Parent() row: ProductionPlanRow,
    ): Promise<Machine | null> {
        return this.service.getRowMachine({ machine_id: row.machine_id });
    }

    // Batched: a 20-row plan asks for this 20 times, and one `IN` read answers
    // all of them. The loader is created once per request on the GraphQL
    // context — never on this resolver, which Nest instantiates once for the
    // life of the process and would therefore cache across requests.
    //
    // `employees` below is the same shape and the same N+1; it is deliberately
    // left alone for now so this change is one behaviour, and it is the next
    // thing this pattern applies to.
    @ResolveField(() => [ProductionPlanRowProduct])
    async products(
        @Parent() row: ProductionPlanRow,
        @Context() context: LoaderContext,
    ): Promise<ProductionPlanRowProduct[]> {
        const loader = getRequestLoader<number, ProductionPlanRowProduct[]>(
            context,
            'productionPlanRowProducts',
            () =>
                createBatchLoader((rowIds) =>
                    this.service.getProductionPlanRowProductsByRowIds({
                        production_plan_row_ids: rowIds,
                    }),
                ),
        );
        return (await loader.load(row.id)) ?? [];
    }

    @ResolveField(() => [Employee])
    async employees(
        @Parent() row: ProductionPlanRow,
    ): Promise<Employee[]> {
        return this.service.getRowEmployees({
            production_plan_row_id: row.id,
        });
    }
}

@Resolver(() => ProductionPlanRowProduct)
@UseGuards(GqlAuthGuard)
@Injectable()
export class ProductionPlanRowProductsResolver {
    constructor(private service: ProductionPlansService) {}

    // Batched, and the bigger of the two wins: this field runs once per planned
    // product across the whole plan (40 on a 20-row plan with two products
    // each). The loader also dedupes by id within the request, so the same bolsa
    // planned on three machines is read once.
    @ResolveField(() => Product, { nullable: true })
    async product(
        @Parent() rowProduct: ProductionPlanRowProduct,
        @Context() context: LoaderContext,
    ): Promise<Product | null> {
        if (!rowProduct.product_id) return null;
        const loader = getRequestLoader<number, Product>(
            context,
            'productionPlanRowProduct.product',
            () =>
                createBatchLoader((productIds) =>
                    this.service.getRowProductsByIds({
                        product_ids: productIds,
                    }),
                ),
        );
        return (await loader.load(rowProduct.product_id)) ?? null;
    }
}
