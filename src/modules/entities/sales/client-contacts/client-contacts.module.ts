import { Module } from '@nestjs/common';
import { ClientContactsResolver } from './client-contacts.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { ClientContactsService } from './client-contacts.service';

@Module({
    providers: [PrismaService, ClientContactsResolver, ClientContactsService],
    exports: [ClientContactsResolver],
})
export class ClientContactsModule {}
