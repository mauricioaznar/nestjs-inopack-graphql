import { Injectable, Logger } from '@nestjs/common';
import { SpareInventoryService } from '../../../../common/services/entities/spare-inventory.service';
import { SparesSeed } from '../../types/spares-seed';
import { SpareOperationsService } from '../../../entities/maintenance/spare-operations/spare-operations.service';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Injectable()
export class SpareInventorySeederService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: Logger,
        private readonly spareInventoryService: SpareInventoryService,
        private readonly spareAdjustmentsService: SpareOperationsService,
    ) {}

    async adjustInventory(sparesSeed: SparesSeed): Promise<void> {
        await this.spareAdjustmentsService.upsertSpareAdjustment({
            description: 'Ajuste de bandas',
            date: new Date('2022-04-24T00:00:00Z'),
            spare_transactions: [
                {
                    spare_id: sparesSeed.materials.banda700.id,
                    quantity: 4,
                },
                {
                    spare_id: sparesSeed.materials.banda600.id,
                    quantity: 2,
                },
                {
                    spare_id: sparesSeed.materials.banda800.id,
                    quantity: 10,
                },
            ],
        });
        await this.spareAdjustmentsService.upsertSpareAdjustment({
            description: 'Ajuste de contactores',
            date: new Date('2022-04-24T00:00:00Z'),
            spare_transactions: [
                {
                    spare_id: sparesSeed.materials.contactor500.id,
                    quantity: 2,
                },
                {
                    spare_id: sparesSeed.materials.contactor400.id,
                    quantity: 1,
                },
            ],
        });
        await this.spareAdjustmentsService.upsertSpareAdjustment({
            description: 'Ajuste de tornillos',
            date: new Date('2022-04-21T00:00:00Z'),
            spare_transactions: [
                {
                    spare_id: sparesSeed.materials.tornillo2.id,
                    quantity: 20,
                },
                {
                    spare_id: sparesSeed.materials.tornillo3.id,
                    quantity: 30,
                },
            ],
        });
        await this.spareAdjustmentsService.upsertSpareAdjustment({
            description: 'Ajuste gomas',
            date: new Date('2022-03-01T00:00:00Z'),
            spare_transactions: [
                {
                    spare_id: sparesSeed.materials.gomas1.id,
                    quantity: 50,
                },
                {
                    spare_id: sparesSeed.materials.gomas2.id,
                    quantity: -80,
                },
            ],
        });

        await this.spareAdjustmentsService.upsertSpareAdjustment({
            description: 'Ajuste de resistencias',
            date: new Date('2022-01-31T00:00:00Z'),
            spare_transactions: [
                {
                    spare_id: sparesSeed.materials.resistencia30.id,
                    quantity: 1,
                },
            ],
        });
    }
}
