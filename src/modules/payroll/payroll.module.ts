import { Module } from '@nestjs/common';
import { PayrollResolver } from './payroll.resolver';
import { PayrollService } from './payroll.service';

@Module({
    providers: [PayrollResolver, PayrollService],
})
export class PayrollModule {}
