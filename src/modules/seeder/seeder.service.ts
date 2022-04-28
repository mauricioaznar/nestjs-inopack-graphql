import { Injectable } from '@nestjs/common';
import { SpareCategorySeederService } from './modules/spare-category-seeder/spare-category-seeder.service';
import { SpareSeederService } from './modules/spare-seeder/spare-seeder.service';
import { MachineSeederService } from './modules/machine-seeder/machine-seeder.service';
import { SpareInventorySeederService } from './modules/spare-inventory-seeder/spare-inventory-seeder.service';

@Injectable()
export class SeederService {
    constructor(
        private readonly spareCategorySeederService: SpareCategorySeederService,
        private readonly spareSeederService: SpareSeederService,
        private readonly machineSeederService: MachineSeederService,
        private readonly spareInventorySeederService: SpareInventorySeederService,
    ) {}

    async seed() {
        const categoriesSeed =
            await this.spareCategorySeederService.createSpareCategories();
        const sparesSeed = await this.spareSeederService.createSpares(
            categoriesSeed,
        );
        await this.machineSeederService.getMachines(sparesSeed);
        await this.spareInventorySeederService.adjustInventory(sparesSeed);
    }
}
