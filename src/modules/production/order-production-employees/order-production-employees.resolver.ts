import { Args, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderProductionEmployeesService } from './order-production-employees.service';
import { Public } from '../../auth/decorators/public.decorator';
import { OrderProductionEmployee } from '../../../common/dto/entities/production/order-production-employee.dto';
import { Employee } from '../../../common/dto/entities/production/employee.dto';

@Resolver(() => OrderProductionEmployee)
@Public()
@Injectable()
export class OrderProductionEmployeesResolver {
    constructor(private service: OrderProductionEmployeesService) {}

    @Query(() => OrderProductionEmployee)
    async getOrderProductionEmployee(
        @Args('OrderProductionEmployeeId') orderProductionEmployeeId: number,
    ): Promise<OrderProductionEmployee | null> {
        return this.service.getOrderProductionEmployee({
            order_production_employee_id: orderProductionEmployeeId,
        });
    }

    @ResolveField(() => Employee, { nullable: true })
    employee(
        orderProductionEmployee: OrderProductionEmployee,
    ): Promise<Employee | null> {
        return this.service.getEmployee({
            employee_id: orderProductionEmployee.employee_id,
        });
    }
}
