import { Module } from '@nestjs/common';
import { TransfersModule } from './transfers/transfers.module';

@Module({
    imports: [TransfersModule],
})
export class ExpendituresModule {}
