import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { MachinesService } from '../../../entities/machines/machines.service';
import { MachinesSeed } from '../../types/machines-seed';
import { MachineSectionsService } from '../../../entities/machine-sections/machine-sections.service';
import { MachineComponentsService } from '../../../entities/machine-components/machine-components.service';

@Injectable()
export class MachineSeederService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly machinesService: MachinesService,
    private readonly machineSectionsService: MachineSectionsService,
    private readonly machineComponentsService: MachineComponentsService,
  ) {}

  async getCmd(): Promise<MachinesSeed['cmd']> {
    const cmd = await this.machinesService.getMachine({
      id: 1,
    });

    // seccion 1
    const cmdSection1 = await this.machineSectionsService.addMachineSection({
      machine_id: cmd.id,
      name: 'Tablero',
    });
    const componente1 = await this.machineComponentsService.addMachineComponent(
      {
        machine_section_id: cmdSection1.id,
        name: 'Bandas',
      },
    );
    const componente2 = await this.machineComponentsService.addMachineComponent(
      {
        machine_section_id: cmdSection1.id,
        name: 'Resistencias',
      },
    );
    const componente3 = await this.machineComponentsService.addMachineComponent(
      {
        machine_section_id: cmdSection1.id,
        name: 'Contactor',
      },
    );

    // seccion 2
    const cmdSection2 = await this.machineSectionsService.addMachineSection({
      machine_id: cmd.id,
      name: 'Cabezal',
    });
    const componente4 = await this.machineComponentsService.addMachineComponent(
      {
        machine_section_id: cmdSection2.id,
        name: 'Contactor',
      },
    );
    const componente5 = await this.machineComponentsService.addMachineComponent(
      {
        machine_section_id: cmdSection2.id,
        name: 'Banda',
      },
    );

    // seccion 3
    const cmdSection3 = await this.machineSectionsService.addMachineSection({
      machine_id: cmd.id,
      name: 'Seccion 3',
    });
    const componente6 = await this.machineComponentsService.addMachineComponent(
      {
        machine_section_id: cmdSection3.id,
        name: 'componente 6',
      },
    );

    const componente7 = await this.machineComponentsService.addMachineComponent(
      {
        machine_section_id: cmdSection3.id,
        name: 'componente 7',
      },
    );

    const componente8 = await this.machineComponentsService.addMachineComponent(
      {
        machine_section_id: cmdSection3.id,
        name: 'componente 8',
      },
    );

    const componente9 = await this.machineComponentsService.addMachineComponent(
      {
        machine_section_id: cmdSection3.id,
        name: 'componente 9',
      },
    );

    // seccion 4
    const cmdSection4 = await this.machineSectionsService.addMachineSection({
      machine_id: cmd.id,
      name: 'Seccion 4',
    });
    const componente10 =
      await this.machineComponentsService.addMachineComponent({
        machine_section_id: cmdSection4.id,
        name: 'componente 10',
      });

    return {
      machine: cmd,
      sections: {
        seccion1: {
          section: cmdSection1,
          components: {
            componente1,
            componente2,
            componente3,
          },
        },
        seccion2: {
          section: cmdSection2,
          components: {
            componente4,
            componente5,
          },
        },
        seccion3: {
          section: cmdSection3,
          components: {
            componente6,
            componente7,
            componente8,
            componente9,
          },
        },
        seccion4: {
          section: cmdSection4,
          components: {
            componente10,
          },
        },
      },
    };
  }

  async getMachines(): Promise<MachinesSeed> {
    const cmd = await this.getCmd();

    // Camisetera 1
    const camisetera1 = await this.machinesService.getMachine({
      id: 2,
    });

    const camisetera2 = await this.machinesService.getMachine({
      id: 3,
    });
    const camisetera3 = await this.machinesService.getMachine({
      id: 4,
    });
    const selloLateral1 = await this.machinesService.getMachine({
      id: 5,
    });
    const extrusoraMinigrip = await this.machinesService.getMachine({
      id: 6,
    });
    const extrusora2 = await this.machinesService.getMachine({
      id: 7,
    });
    const extrusora3 = await this.machinesService.getMachine({
      id: 8,
    });
    const extrusora4 = await this.machinesService.getMachine({
      id: 9,
    });
    const extrusora5 = await this.machinesService.getMachine({
      id: 10,
    });
    const extrusora6 = await this.machinesService.getMachine({
      id: 11,
    });
    const extrusora7 = await this.machinesService.getMachine({
      id: 12,
    });
    const dobladora3 = await this.machinesService.getMachine({
      id: 13,
    });
    const selloDeFondo2 = await this.machinesService.getMachine({
      id: 14,
    });
    const coemter = await this.machinesService.getMachine({
      id: 15,
    });
    const shelda = await this.machinesService.getMachine({
      id: 16,
    });
    const dobladora4 = await this.machinesService.getMachine({
      id: 17,
    });
    const compactadora = await this.machinesService.getMachine({
      id: 20,
    });

    return {
      cmd,
      selloLateral1,
      camisetera1,
      camisetera2,
      camisetera3,
      extrusora2,
      extrusora3,
      extrusoraMinigrip,
      extrusora4,
      extrusora5,
      extrusora6,
      extrusora7,
      shelda,
      selloDeFondo2,
      dobladora3,
      dobladora4,
      coemter,
      compactadora,
    };
  }
}
