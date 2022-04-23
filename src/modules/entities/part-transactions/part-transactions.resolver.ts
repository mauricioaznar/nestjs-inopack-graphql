import { ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { PartTransactionsService } from './part-transactions.service';
import { Part } from '../../../common/dto/entities/part.dto';
import { PartTransaction } from '../../../common/dto/entities/part-transactions.dto';
import { PartAdjustment } from '../../../common/dto/entities/part-adjustment.dto';

@Resolver(() => PartTransaction)
@Injectable()
export class PartTransactionsResolver {
  constructor(private partTransactionsService: PartTransactionsService) {}

  @ResolveField(() => Part, { nullable: true })
  async part(partTransaction: PartTransaction): Promise<Part | null> {
    return this.partTransactionsService.getPart({
      part_id: partTransaction.part_id,
    });
  }

  @ResolveField(() => PartAdjustment, { nullable: true })
  async part_adjustment(
    partTransaction: PartTransaction,
  ): Promise<PartAdjustment | null> {
    return this.partTransactionsService.getPartAdjustment({
      part_adjustment_id: partTransaction.part_adjustment_id,
    });
  }
}
