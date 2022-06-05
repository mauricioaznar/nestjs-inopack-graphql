import { Module } from '@nestjs/common';
import { MachineSectionsResolver } from './machine-sections.resolver';
import { MachineSectionsService } from './machine-sections.service';

@Module({
    providers: [MachineSectionsResolver, MachineSectionsService],
    exports: [MachineSectionsResolver],
})
export class MachineSectionsModule {}
