import { Module } from '@nestjs/common';
import { SpareTransactionsResolver } from './spare-transactions.resolver';
import { SpareTransactionsService } from './spare-transactions.service';

@Module({
    providers: [SpareTransactionsResolver, SpareTransactionsService],
    exports: [SpareTransactionsResolver],
})
export class SpareTransactionsModule {}
