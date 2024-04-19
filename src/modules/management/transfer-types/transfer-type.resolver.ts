import { Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { TransferTypeService } from './transfer-type.service';
import { TransferReceipt } from '../../../common/dto/entities';
import { Public } from '../../auth/decorators/public.decorator';
import { TransferType } from '../../../common/dto/entities/management/transfer-type.dto';

@Resolver(() => TransferReceipt)
// @Role('super')
@Public()
@Injectable()
export class TransferTypeResolver {
    constructor(private service: TransferTypeService) {}

    @Query(() => [TransferType])
    async getTransferTypes(): Promise<TransferType[]> {
        return this.service.getTransferTypes();
    }
}
