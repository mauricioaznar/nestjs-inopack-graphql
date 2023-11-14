import { Module } from '@nestjs/common';
import { ExpenseRawMaterialAdditionsResolver } from './expense-raw-material-additions.resolver';
import { ExpenseRawMaterialAdditionsService } from './expense-raw-material-additions.service';

@Module({
    providers: [
        ExpenseRawMaterialAdditionsResolver,
        ExpenseRawMaterialAdditionsService,
    ],
    exports: [ExpenseRawMaterialAdditionsResolver],
})
export class ExpenseRawMaterialAdditionsModule {}
