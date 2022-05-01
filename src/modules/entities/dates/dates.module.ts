import { Module } from '@nestjs/common';
import { YearsModule } from './year/years.module';
import { MonthsModule } from './month/months.module';
import { DaysModule } from './day/days.module';

@Module({
    imports: [YearsModule, MonthsModule, DaysModule],
})
export class DatesModule {}
