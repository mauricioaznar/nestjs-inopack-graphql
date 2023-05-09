import { Module } from '@nestjs/common';
import { SuppliersResolver } from './suppliers.resolver';
import { SuppliersService } from './suppliers.service';

@Module({
    providers: [SuppliersResolver, SuppliersService],
    exports: [SuppliersResolver],
})
export class SuppliersModule {}
