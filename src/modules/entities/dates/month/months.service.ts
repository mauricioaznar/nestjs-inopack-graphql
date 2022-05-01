import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { Month } from '../../../../common/dto/entities/dates/month/month';

@Injectable()
export class MonthsService {
    constructor(private prisma: PrismaService) {}

    async getMonths({ year }: { year: number }): Promise<Month[]> {
        return Array.from(Array(12)).map((item, index) => {
            return {
                year,
                month: index,
            };
        });
    }
}
