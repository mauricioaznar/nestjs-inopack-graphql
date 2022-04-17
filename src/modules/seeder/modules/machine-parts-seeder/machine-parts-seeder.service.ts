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
    // component 1
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

    // component 2
    await this.machineCompatibilitiesService.addMachineCompatiblePart({
      machine_component_id:
        machinesSeed.cmd.sections.seccion1.components.componente2.id,
      part_id: partsSeed.materials.resistencia20.id,
    });

    await this.machineCompatibilitiesService.addMachineCompatiblePart({
      machine_component_id:
        machinesSeed.cmd.sections.seccion1.components.componente2.id,
      part_id: partsSeed.materials.resistencia30.id,
    });

    await this.machineComponentsService.updateMachineComponentCurrentPart(
      {
        machineComponentId:
          machinesSeed.cmd.sections.seccion1.components.componente2.id,
      },
      {
        current_part_id: partsSeed.materials.resistencia20.id,
        current_part_required_quantity: 3,
      },
    );

    // component 3
    await this.machineCompatibilitiesService.addMachineCompatiblePart({
      machine_component_id:
        machinesSeed.cmd.sections.seccion1.components.componente3.id,
      part_id: partsSeed.materials.contactor400.id,
    });

    await this.machineCompatibilitiesService.addMachineCompatiblePart({
      machine_component_id:
        machinesSeed.cmd.sections.seccion1.components.componente3.id,
      part_id: partsSeed.materials.contactor500.id,
    });

    await this.machineComponentsService.updateMachineComponentCurrentPart(
      {
        machineComponentId:
          machinesSeed.cmd.sections.seccion1.components.componente3.id,
      },
      {
        current_part_id: partsSeed.materials.contactor500.id,
        current_part_required_quantity: 1,
      },
    );

    // component 4
    await this.machineCompatibilitiesService.addMachineCompatiblePart({
      machine_component_id:
        machinesSeed.cmd.sections.seccion2.components.componente4.id,
      part_id: partsSeed.materials.contactor400.id,
    });

    await this.machineComponentsService.updateMachineComponentCurrentPart(
      {
        machineComponentId:
          machinesSeed.cmd.sections.seccion2.components.componente4.id,
      },
      {
        current_part_id: partsSeed.materials.contactor400.id,
        current_part_required_quantity: 1,
      },
    );

    // component 5
    await this.machineCompatibilitiesService.addMachineCompatiblePart({
      machine_component_id:
        machinesSeed.cmd.sections.seccion2.components.componente5.id,
      part_id: partsSeed.materials.banda600.id,
    });

    await this.machineCompatibilitiesService.addMachineCompatiblePart({
      machine_component_id:
        machinesSeed.cmd.sections.seccion2.components.componente5.id,
      part_id: partsSeed.materials.banda700.id,
    });

    await this.machineComponentsService.updateMachineComponentCurrentPart(
      {
        machineComponentId:
          machinesSeed.cmd.sections.seccion2.components.componente5.id,
      },
      {
        current_part_id: partsSeed.materials.banda600.id,
        current_part_required_quantity: 2,
      },
    );

    // component 6
    await this.machineCompatibilitiesService.addMachineCompatiblePart({
      machine_component_id:
        machinesSeed.cmd.sections.seccion3.components.componente6.id,
      part_id: partsSeed.materials.tornillo1.id,
    });

    await this.machineCompatibilitiesService.addMachineCompatiblePart({
      machine_component_id:
        machinesSeed.cmd.sections.seccion3.components.componente6.id,
      part_id: partsSeed.materials.tornillo2.id,
    });

    await this.machineComponentsService.updateMachineComponentCurrentPart(
      {
        machineComponentId:
          machinesSeed.cmd.sections.seccion3.components.componente6.id,
      },
      {
        current_part_id: partsSeed.materials.tornillo1.id,
        current_part_required_quantity: 5,
      },
    );

    // component 7
    await this.machineCompatibilitiesService.addMachineCompatiblePart({
      machine_component_id:
        machinesSeed.cmd.sections.seccion3.components.componente7.id,
      part_id: partsSeed.materials.gomas1.id,
    });

    await this.machineComponentsService.updateMachineComponentCurrentPart(
      {
        machineComponentId:
          machinesSeed.cmd.sections.seccion3.components.componente7.id,
      },
      {
        current_part_id: partsSeed.materials.gomas1.id,
        current_part_required_quantity: 8,
      },
    );

    // component 8
    await this.machineCompatibilitiesService.addMachineCompatiblePart({
      machine_component_id:
        machinesSeed.cmd.sections.seccion3.components.componente8.id,
      part_id: partsSeed.materials.tornillo3.id,
    });

    await this.machineComponentsService.updateMachineComponentCurrentPart(
      {
        machineComponentId:
          machinesSeed.cmd.sections.seccion3.components.componente8.id,
      },
      {
        current_part_id: partsSeed.materials.tornillo3.id,
        current_part_required_quantity: 20,
      },
    );

    // component 9
    await this.machineCompatibilitiesService.addMachineCompatiblePart({
      machine_component_id:
        machinesSeed.cmd.sections.seccion3.components.componente9.id,
      part_id: partsSeed.materials.contactor900.id,
    });

    await this.machineComponentsService.updateMachineComponentCurrentPart(
      {
        machineComponentId:
          machinesSeed.cmd.sections.seccion3.components.componente9.id,
      },
      {
        current_part_id: partsSeed.materials.contactor900.id,
        current_part_required_quantity: 1,
      },
    );

    // component 10
    await this.machineCompatibilitiesService.addMachineCompatiblePart({
      machine_component_id:
        machinesSeed.cmd.sections.seccion4.components.componente10.id,
      part_id: partsSeed.materials.banda800.id,
    });

    await this.machineComponentsService.updateMachineComponentCurrentPart(
      {
        machineComponentId:
          machinesSeed.cmd.sections.seccion4.components.componente10.id,
      },
      {
        current_part_id: partsSeed.materials.banda800.id,
        current_part_required_quantity: 3,
      },
    );

    // component 11
    await this.machineCompatibilitiesService.addMachineCompatiblePart({
      machine_component_id:
        machinesSeed.cmd.unassigned_components.component11.id,
      part_id: partsSeed.materials.balero1.id,
    });

    await this.machineComponentsService.updateMachineComponentCurrentPart(
      {
        machineComponentId:
          machinesSeed.cmd.unassigned_components.component11.id,
      },
      {
        current_part_id: partsSeed.materials.balero1.id,
        current_part_required_quantity: 3,
      },
    );
  }
}
