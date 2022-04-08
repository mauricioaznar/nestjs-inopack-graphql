import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { PartsSeed } from '../../types/parts-seed';
import { MachinesSeed } from '../../types/machines-seed';
import { MachineComponentsService } from '../../../entities/machine-components/machine-components.service';
import { MachineCompatibilitiesService } from '../../../entities/machine-compatibilities/machine-compatibilities.service';

@Injectable()
export class MachinePartsSeederService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
    private readonly machineComponentsService: MachineComponentsService,
    private readonly machineCompatibilitiesService: MachineCompatibilitiesService,
  ) {}

  async assignPartsToComponents(
    partsSeed: PartsSeed,
    machinesSeed: MachinesSeed,
  ) {
    await this.machineCompatibilitiesService.addMachineCompatiblePart({
      machine_component_id:
        machinesSeed.cmd.sections.seccion1.components.componente1.id,
      part_id: partsSeed.materials.banda700.id,
    });

    await this.machineCompatibilitiesService.addMachineCompatiblePart({
      machine_component_id:
        machinesSeed.cmd.sections.seccion1.components.componente1.id,
      part_id: partsSeed.materials.banda800.id,
    });

    await this.machineComponentsService.updateMachineComponentCurrentPart(
      {
        machineComponentId:
          machinesSeed.cmd.sections.seccion1.components.componente1.id,
      },
      {
        current_part_id: partsSeed.materials.banda700.id,
        current_part_required_quantity: 2,
      },
    );
  }
}
