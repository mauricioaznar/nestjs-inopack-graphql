import { Global, Module } from '@nestjs/common';
import { AuditUsersService } from './audit-users.service';

// Cross-cutting: AuditUsersService resolves created_by / updated_by user attribution
// for resolvers across every domain (12 modules today). Declared @Global so it is
// instantiated once and injectable everywhere without each consumer importing this
// module — the same treatment PrismaModule / PubSubModule already get. It depends only
// on the (global) PrismaService, so it imports nothing and cannot form a dependency cycle.
@Global()
@Module({
    providers: [AuditUsersService],
    exports: [AuditUsersService],
})
export class AuditUsersModule {}
