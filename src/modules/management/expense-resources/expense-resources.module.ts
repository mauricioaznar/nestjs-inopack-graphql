import { Module } from '@nestjs/common';
import { ExpenseResourcesResolver } from './expense-resources.resolver';
import { ExpenseResourcesService } from './expense-resources.service';

@Module({
    providers: [ExpenseResourcesResolver, ExpenseResourcesService],
})
export class ExpenseResourcesModule {}
