import { Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { YearsService } from './years.service';
import { Year } from '../../../../common/dto/entities';
import { Public } from '../../../auth/decorators/public.decorator';

@Resolver(() => Year)
@Public()
@Injectable()
export class YearsResolver {
    constructor(private service: YearsService) {}

    @Query(() => [Year])
    async getYears(): Promise<Year[]> {
        return this.service.getYears();
    }
}
