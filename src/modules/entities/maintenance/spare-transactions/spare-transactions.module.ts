import { Module } from '@nestjs/common';
import { SpareTransactionsResolver } from './spare-transactions.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { SpareTransactionsService } from './spare-transactions.service';

@Module({
    providers: [
        PrismaService,
        SpareTransactionsResolver,
        SpareTransactionsService,
    ],
    exports: [SpareTransactionsResolver],
})
export class SpareTransactionsModule {}
