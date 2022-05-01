import { Args, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { DaysService } from './days.service';
import { Public } from '../../../auth/decorators/public.decorator';
import { Day } from '../../../../common/dto/entities/dates/day/day';

@Resolver(() => Day)
@Public()
@Injectable()
export class DaysResolver {
    constructor(private service: DaysService) {}

    @Query(() => [Day])
    async getDays(
        @Args('year') year: number,
        @Args('month') month: number,
    ): Promise<Day[]> {
        return this.service.getDays({ year, month });
    }
}
