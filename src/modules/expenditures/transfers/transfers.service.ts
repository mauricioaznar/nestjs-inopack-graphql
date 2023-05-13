import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Transfer, TransferUpsertInput } from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class TransfersService {
    constructor(private prisma: PrismaService) {}

    async getTransfer({
        transfer_id,
    }: {
        transfer_id: number;
    }): Promise<Transfer | null> {
        return this.prisma.transfers.findFirst({
            where: {
                id: transfer_id,
                active: 1,
            },
        });
    }

    async getTransfers(): Promise<Transfer[]> {
        return this.prisma.transfers.findMany({
            where: {
                active: 1,
            },
        });
    }

    async upsertTransfer(
        transferInput: TransferUpsertInput,
    ): Promise<Transfer> {
        await this.validateUpsertTransfer(transferInput);

        return this.prisma.transfers.upsert({
            create: {
                amount: transferInput.amount,
                from_account_id: transferInput.from_account_id,
                to_account_id: transferInput.to_account_id,
            },
            update: {
                amount: transferInput.amount,
                from_account_id: transferInput.from_account_id,
                to_account_id: transferInput.to_account_id,
            },
            where: {
                id: transferInput.id || 0,
            },
        });
    }

    async validateUpsertTransfer(
        transferUpsertInput: TransferUpsertInput,
    ): Promise<void> {
        const errors: string[] = [];

        // order production type cant change

        if (transferUpsertInput.id) {
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }

    async deleteTransfer({
        transfer_id,
    }: {
        transfer_id: number;
    }): Promise<boolean> {
        const transfer = await this.getTransfer({ transfer_id: transfer_id });

        if (!transfer_id) {
            throw new NotFoundException();
        }

        await this.prisma.transfers.update({
            data: {
                active: -1,
            },
            where: {
                id: transfer_id,
            },
        });

        return true;
    }

    async isDeletable({
        transfer_id,
    }: {
        transfer_id: number;
    }): Promise<boolean> {
        return true;
    }
}
