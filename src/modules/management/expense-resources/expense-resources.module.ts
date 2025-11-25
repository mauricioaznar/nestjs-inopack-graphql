import { Module } from '@nestjs/common';
import { ExpenseResourcesResolver } from './expense-resources.resolver';
import { ExpenseResourcesService } from './expense-resources.service';

@Module({
    providers: [ExpenseResourcesResolver, ExpenseResourcesService],
    exports: [ExpenseResourcesResolver],
})
export class ExpenseResourcesModule {}
