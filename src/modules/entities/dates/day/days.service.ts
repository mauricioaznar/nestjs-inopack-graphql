import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { Day } from '../../../../common/dto/entities/dates/day/day';
import dayjs from 'dayjs';

@Injectable()
export class DaysService {
    constructor(private prisma: PrismaService) {}

    async getDays({
        year,
        month,
    }: {
        year: number;
        month: number;
    }): Promise<Day[]> {
        const daysInMonth = dayjs()
            .utc()
            .set('year', year)
            .set('month', month)
            .daysInMonth();

        return Array.from(Array(daysInMonth)).map((item, index) => {
            return {
                year,
                month,
                day: index + 1,
            };
        });
    }
}
