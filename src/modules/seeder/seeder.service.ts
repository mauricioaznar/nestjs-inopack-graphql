import { Injectable } from '@nestjs/common';
import { PartCategorySeederService } from './modules/part-category-seeder/part-category-seeder.service';
import { PartSeederService } from './modules/part-seeder/part-seeder.service';
import { MachineSeederService } from './modules/machine-seeder/machine-seeder.service';
import { PartInventorySeederService } from './modules/part-inventory-seeder/part-inventory-seeder.service';

@Injectable()
export class SeederService {
  constructor(
    private readonly partCategorySeederService: PartCategorySeederService,
    private readonly partSeederService: PartSeederService,
    private readonly machineSeederService: MachineSeederService,
    private readonly partInventorySeederService: PartInventorySeederService,
  ) {}

  async seed() {
    const categoriesSeed =
      await this.partCategorySeederService.createPartCategories();
    const partsSeed = await this.partSeederService.createParts(categoriesSeed);
    await this.machineSeederService.getMachines(partsSeed);
    await this.partInventorySeederService.adjustInventory(partsSeed);
  }
}
