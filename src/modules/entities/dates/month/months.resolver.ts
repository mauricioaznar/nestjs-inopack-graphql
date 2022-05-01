import { Args, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { MonthsService } from './months.service';
import { Year } from '../../../../common/dto/entities';
import { Public } from '../../../auth/decorators/public.decorator';
import { Month } from '../../../../common/dto/entities/dates/month/month';

@Resolver(() => Month)
@Public()
@Injectable()
export class MonthsResolver {
    constructor(private service: MonthsService) {}

    @Query(() => [Month])
    async getMonths(@Args('year') year: number): Promise<Month[]> {
        return this.service.getMonths({ year });
    }
}
