import {
    Args,
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
    ActivityEntityName,
    ActivityTypeName,
    Branch,
    GetProductionPlanArgs,
    GetProductionPlansArgs,
    Machine,
    Product,
    ProductionPlan,
    ProductionPlanRow,
    ProductionPlanUpsertInput,
    User,
} from '../../../common/dto/entities';
import { Employee } from '../../../common/dto/entities/production/employee.dto';
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
        await this.pubSubService.publishActivity({
            entity_name: ActivityEntityName.PRODUCTION_PLAN,
            type: !input.id
                ? ActivityTypeName.CREATE
                : ActivityTypeName.UPDATE,
            entity_id: productionPlan.id,
            userId: currentUser.id,
            description: `Planeación: ${productionPlan.date}`,
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
        await this.pubSubService.publishActivity({
            entity_name: ActivityEntityName.PRODUCTION_PLAN,
            type: ActivityTypeName.DELETE,
            entity_id: productionPlan.id,
            userId: currentUser.id,
            description: `Planeación: ${productionPlan.date}`,
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

    @ResolveField(() => Product, { nullable: true })
    async product(
        @Parent() row: ProductionPlanRow,
    ): Promise<Product | null> {
        return this.service.getRowProduct({ product_id: row.product_id });
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
