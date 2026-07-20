import { Module } from '@nestjs/common';
import { ResourcesResolver } from './resources.resolver';
import { ResourcesService } from './resources.service';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

@Module({
    providers: [ResourcesResolver, ResourcesService, AuditUsersService],
    exports: [ResourcesResolver],
})
export class ResourcesModule {}
