import { Module } from '@nestjs/common';
import { MaterialBalanceSummaryResolver } from './material-balance-summary.resolver';
import { MaterialBalanceSummaryService } from './material-balance-summary.service';

@Module({
    providers: [MaterialBalanceSummaryResolver, MaterialBalanceSummaryService],
    exports: [MaterialBalanceSummaryResolver],
})
export class MaterialBalanceSummaryModule {}
