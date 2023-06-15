import { Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ReceiptTypeService } from './receipt-type.service';
import { ReceiptType } from '../../../common/dto/entities';
import { Public } from '../../auth/decorators/public.decorator';

@Resolver(() => ReceiptType)
// @Role('super')
@Public()
@Injectable()
export class ReceiptTypeResolver {
    constructor(private service: ReceiptTypeService) {}

    @Query(() => [ReceiptType])
    async getReceiptTypes(): Promise<ReceiptType[]> {
        return this.service.getReceiptTypes();
    }
}
