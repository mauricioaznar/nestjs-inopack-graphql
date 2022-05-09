import { Module } from '@nestjs/common';
import { ClientsResolver } from './clients.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { ClientsService } from './clients.service';

@Module({
    providers: [PrismaService, ClientsResolver, ClientsService],
    exports: [ClientsResolver],
})
export class ClientsModule {}
