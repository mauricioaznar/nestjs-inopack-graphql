import { Module } from '@nestjs/common';
import { SuppliersModule } from './suppliers/suppliers.module';
import { ExpensesModule } from './expenses/expenses.module';

@Module({
    imports: [SuppliersModule, ExpensesModule],
})
export class ExpendituresModule {}
