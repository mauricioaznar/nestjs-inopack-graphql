import { Module } from '@nestjs/common';
import { TransfersResolver } from './transfers.resolver';
import { TransfersService } from './transfers.service';

@Module({
    providers: [TransfersResolver, TransfersService],
    exports: [TransfersResolver],
})
export class TransfersModule {}
