import { Module } from '@nestjs/common';
import { PackingsResolver } from './packings.resolver';
import { PackingsService } from './packings.service';

@Module({
    providers: [PackingsResolver, PackingsService],
    exports: [PackingsResolver],
})
export class PackingsModule {}
