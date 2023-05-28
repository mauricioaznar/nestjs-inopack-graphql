import { Injectable } from '@nestjs/common';
import { SpareCategorySeederService } from './modules/spare-category-seeder/spare-category-seeder.service';
import { SpareSeederService } from './modules/spare-seeder/spare-seeder.service';
import { MachineSeederService } from './modules/machine-seeder/machine-seeder.service';
import { SpareInventorySeederService } from './modules/spare-inventory-seeder/spare-inventory-seeder.service';
import { PrismaService } from '../../common/modules/prisma/prisma.service';

@Injectable()
export class SeederService {
    constructor(
        private readonly spareCategorySeederService: SpareCategorySeederService,
        private readonly spareSeederService: SpareSeederService,
        private readonly machineSeederService: MachineSeederService,
        private readonly spareInventorySeederService: SpareInventorySeederService,
        private readonly prisma: PrismaService,
    ) {}

    async machinarySeed() {
        const categoriesSeed =
            await this.spareCategorySeederService.createSpareCategories();
        const sparesSeed = await this.spareSeederService.createSpares(
            categoriesSeed,
        );
        await this.machineSeederService.getMachines(sparesSeed);
        await this.spareInventorySeederService.adjustInventory(sparesSeed);
    }

    async transfersSeed() {
        const orderSalesProducts =
            await this.prisma.order_sale_products.findMany({
                where: {
                    active: 1,
                    order_sales: {
                        active: 1,
                    },
                },
            });

        console.log(orderSalesProducts);
    }
}
