import { Module } from '@nestjs/common';
import { PartTransactionsResolver } from './part-transactions.resolver';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import { PartTransactionsService } from './part-transactions.service';

@Module({
  providers: [PrismaService, PartTransactionsResolver, PartTransactionsService],
  exports: [PartTransactionsResolver],
})
export class PartTransactionsModule {}
