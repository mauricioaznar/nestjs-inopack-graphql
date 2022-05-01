import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { Year } from '../../../../common/dto/entities';
import dayjs from 'dayjs';

@Injectable()
export class YearsService {
    constructor(private prisma: PrismaService) {}

    async getYears(): Promise<Year[]> {
        const years: Year[] = [];
        let dateStart = dayjs().utc().subtract(2, 'years');
        const dateEnd = dayjs().utc();

        while (dateEnd.diff(dateStart, 'years') >= 0) {
            years.push({
                year: Number(dateStart.format('YYYY')),
            });
            dateStart = dateStart.add(1, 'years');
        }

        return years;
    }
}
