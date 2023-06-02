import {
    Args,
    Float,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import {
    Account,
    ActivityTypeName,
    PaginatedTransfers,
    Resource,
    ResourceCategory,
    Transfer,
    TransferReceipt,
    TransfersQueryArgs,
    TransfersSortArgs,
    TransferUpsertInput,
    User,
} from '../../../common/dto/entities';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { RolesDecorator } from '../../auth/decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';

@Resolver(() => Transfer)
@Injectable()
export class TransfersResolver {
    constructor(
        private service: TransfersService,
        private pubSubService: PubSubService,
    ) {}

    @Mutation(() => Transfer)
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.ADMIN)
    async upsertTransfer(
        @Args('TransferUpsertInput') input: TransferUpsertInput,
        @CurrentUser() currentUser: User,
    ) {
        const transfer = await this.service.upsertTransfer(input);
        await this.pubSubService.transfer({
            transfer,
            type: !input.id ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            userId: currentUser.id,
        });

        return transfer;
    }

    @Mutation(() => Boolean)
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.ADMIN)
    async deleteTransfer(
        @Args('TransferId') transferId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        const transfer = await this.getTransfer(transferId);
        if (!transfer) throw new NotFoundException();
        await this.service.deleteTransfer({
            transfer_id: transfer.id,
        });
        await this.pubSubService.transfer({
            transfer,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
        });
        return true;
    }

    @Query(() => Transfer, {
        nullable: true,
    })
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.ADMIN)
    async getTransfer(
        @Args('TransferId') id: number,
    ): Promise<Transfer | null> {
        return this.service.getTransfer({ transfer_id: id });
    }

    @Query(() => [Transfer])
    async getTransfers(): Promise<Transfer[]> {
        return this.service.getTransfers();
    }

    @Query(() => PaginatedTransfers)
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.ADMIN)
    async paginatedTransfers(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false }) datePaginator: YearMonth,
        @Args({ nullable: false })
        transfersQueryArgs: TransfersQueryArgs,
        @Args({ nullable: false })
        transfersSortArgs: TransfersSortArgs,
    ): Promise<PaginatedTransfers> {
        return this.service.paginatedTransfers({
            offsetPaginatorArgs,
            datePaginator,
            transfersQueryArgs,
            transfersSortArgs,
        });
    }

    @ResolveField(() => Boolean)
    async is_deletable(
        @Parent() transfer: Transfer,
        @CurrentUser() user: User,
    ): Promise<boolean> {
        return this.service.isDeletable({
            transfer_id: transfer.id,
        });
    }

    @ResolveField(() => Boolean)
    async is_editable(
        @Parent() transfer: Transfer,
        @CurrentUser() user: User,
    ): Promise<boolean> {
        return this.service.isEditable({
            transfer_id: transfer.id,
        });
    }

    @ResolveField(() => Account, { nullable: true })
    async to_account(@Parent() transfer: Transfer): Promise<Account | null> {
        return this.service.getAccount({
            account_id: transfer.to_account_id,
        });
    }

    @ResolveField(() => Account, { nullable: true })
    async from_account(@Parent() transfer: Transfer): Promise<Account | null> {
        return this.service.getAccount({
            account_id: transfer.from_account_id,
        });
    }

    @ResolveField(() => [TransferReceipt], { nullable: false })
    async transfer_receipts(
        @Parent() transfer: Transfer,
    ): Promise<TransferReceipt[]> {
        return this.service.getTransferReceipts({
            transfer_id: transfer.id,
        });
    }

    @ResolveField(() => Float, { nullable: false })
    async transfer_receipts_total(
        @Parent() transfer: Transfer,
    ): Promise<number> {
        return this.service.getTransferReceiptsTotal({
            transfer_id: transfer.id,
        });
    }

    @Subscription(() => Transfer)
    async transfer() {
        return this.pubSubService.listenForTransfer();
    }
}
