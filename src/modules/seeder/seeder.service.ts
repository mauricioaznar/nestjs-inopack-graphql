import { Injectable } from '@nestjs/common';
import { PartCategorySeederService } from './modules/part-category-seeder/part-category-seeder.service';
import { PartSeederService } from './modules/part-seeder/part-seeder.service';
import { MachineSeederService } from './modules/machine-seeder/machine-seeder.service';
import { MachinePartsSeederService } from './modules/machine-parts-seeder/machine-parts-seeder.service';
import { PartInventorySeederService } from './modules/part-inventory-seeder/part-inventory-seeder.service';

@Injectable()
export class SeederService {
  constructor(
    private readonly partCategorySeederService: PartCategorySeederService,
    private readonly partSeederService: PartSeederService,
    private readonly machineSeederService: MachineSeederService,
    private readonly machinePartsSeederService: MachinePartsSeederService,
    private readonly partInventorySeederService: PartInventorySeederService,
  ) {}

  async seed() {
    const machinesSeed = await this.machineSeederService.getMachines();
    const categoriesSeed =
      await this.partCategorySeederService.createPartCategories();
    const partsSeed = await this.partSeederService.createParts(categoriesSeed);
    await this.machinePartsSeederService.assignPartsToComponents(
      partsSeed,
      machinesSeed,
    );
    await this.partInventorySeederService.adjustInventory(partsSeed);
  }
}
