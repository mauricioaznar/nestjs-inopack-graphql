import { Module } from '@nestjs/common';
import { SpareInventoryService } from './spare-inventory.service';

// Home module for SpareInventoryService (spare stock levels). Consumed by machines,
// spare-operations, spares and the machine / spare-inventory seeders — each imports this
// module instead of re-declaring the service, which used to create a separate instance
// per module (5 in total).
//
// ⚠️ This module MUST NOT import any module that imports it (machines, spare-operations,
// spares, the seeders) — doing so is the exact circular dependency this layout avoids
// (compiles clean, fails at Nest bootstrap). It depends only on the global PrismaService,
// so today it imports nothing; keep it that way. If SpareInventoryService ever needs
// logic that lives in a consumer, extract that shared concept into its own named service
// rather than back-importing the consumer module.
@Module({
    providers: [SpareInventoryService],
    exports: [SpareInventoryService],
})
export class SpareInventoryModule {}
