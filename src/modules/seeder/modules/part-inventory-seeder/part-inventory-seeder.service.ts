import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { PartInventoryService } from '../../../../common/services/entities/part-inventory.service';
import { PartsSeed } from '../../types/parts-seed';
import { PartOperationsService } from '../../../entities/maintenance/part-operations/part-operations.service';

@Injectable()
export class PartInventorySeederService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: Logger,
        private readonly partInventoryService: PartInventoryService,
        private readonly partAdjustmentsService: PartOperationsService,
    ) {}

    async adjustInventory(partsSeed: PartsSeed): Promise<void> {
        await this.partAdjustmentsService.upsertPartAdjustment({
            description: 'Ajuste de bandas',
            date: new Date('2022-04-24T00:00:00Z'),
            part_transactions: [
                {
                    part_id: partsSeed.materials.banda700.id,
                    quantity: 4,
                },
                {
                    part_id: partsSeed.materials.banda600.id,
                    quantity: 2,
                },
                {
                    part_id: partsSeed.materials.banda800.id,
                    quantity: 10,
                },
            ],
        });
        await this.partAdjustmentsService.upsertPartAdjustment({
            description: 'Ajuste de contactores',
            date: new Date('2022-04-24T00:00:00Z'),
            part_transactions: [
                {
                    part_id: partsSeed.materials.contactor500.id,
                    quantity: 2,
                },
                {
                    part_id: partsSeed.materials.contactor400.id,
                    quantity: 1,
                },
            ],
        });
        await this.partAdjustmentsService.upsertPartAdjustment({
            description: 'Ajuste de tornillos',
            date: new Date('2022-04-21T00:00:00Z'),
            part_transactions: [
                {
                    part_id: partsSeed.materials.tornillo2.id,
                    quantity: 20,
                },
                {
                    part_id: partsSeed.materials.tornillo3.id,
                    quantity: 30,
                },
            ],
        });
        await this.partAdjustmentsService.upsertPartAdjustment({
            description: 'Ajuste gomas',
            date: new Date('2022-03-01T00:00:00Z'),
            part_transactions: [
                {
                    part_id: partsSeed.materials.gomas1.id,
                    quantity: 50,
                },
                {
                    part_id: partsSeed.materials.gomas2.id,
                    quantity: -80,
                },
            ],
        });

        await this.partAdjustmentsService.upsertPartAdjustment({
            description: 'Ajuste de resistencias',
            date: new Date('2022-01-31T00:00:00Z'),
            part_transactions: [
                {
                    part_id: partsSeed.materials.resistencia30.id,
                    quantity: 1,
                },
            ],
        });
    }
}
