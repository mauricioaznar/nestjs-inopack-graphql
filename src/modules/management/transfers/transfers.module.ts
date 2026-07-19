import { Module } from '@nestjs/common';
import { TransfersResolver } from './transfers.resolver';
import { TransfersService } from './transfers.service';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

@Module({
    providers: [TransfersResolver, TransfersService, AuditUsersService],
    exports: [TransfersResolver],
})
export class TransfersModule {}
