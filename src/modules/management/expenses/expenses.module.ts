import { Module } from '@nestjs/common';
import { ExpensesResolver } from './expenses.resolver';
import { ExpensesService } from './expenses.service';
import { SpareInventoryService } from '../../../common/services/entities/spare-inventory.service';

@Module({
    providers: [ExpensesResolver, ExpensesService],
    exports: [ExpensesResolver],
})
export class ExpensesModule {}
