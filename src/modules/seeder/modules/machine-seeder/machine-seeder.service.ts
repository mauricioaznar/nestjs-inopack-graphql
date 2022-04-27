import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { MachinesService } from '../../../entities/maintenance/machines/machines.service';
import { MachinesSeed } from '../../types/machines-seed';
import { MachineSectionsService } from '../../../entities/maintenance/machine-sections/machine-sections.service';
import { MachineComponentsService } from '../../../entities/maintenance/machine-components/machine-components.service';
import { PartsSeed } from '../../types/parts-seed';

@Injectable()
export class MachineSeederService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly machinesService: MachinesService,
        private readonly machineSectionsService: MachineSectionsService,
        private readonly machineComponentsService: MachineComponentsService,
    ) {}

    async getCmd(partsSeed: PartsSeed): Promise<MachinesSeed['cmd']> {
        const cmd = await this.machinesService.getMachine({
            id: 1,
        });

        // seccion 1
        const cmdSection1 =
            await this.machineSectionsService.upsertMachineSection({
                machine_id: cmd.id,
                name: 'Tablero',
            });
        const componente1 =
            await this.machineComponentsService.upsertMachineComponent({
                name: 'Bandas',
                machine_id: cmdSection1.machine_id,
                machine_section_id: cmdSection1.id,
                current_part_id: partsSeed.materials.banda700.id,
                current_part_required_quantity: 2,
                machine_compatibilities: [
                    {
                        part_id: partsSeed.materials.banda700.id,
                    },
                    {
                        part_id: partsSeed.materials.banda800.id,
                    },
                ],
            });

        const componente2 =
            await this.machineComponentsService.upsertMachineComponent({
                name: 'Resistencias',
                machine_id: cmdSection1.machine_id,
                machine_section_id: cmdSection1.id,
                current_part_id: partsSeed.materials.resistencia20.id,
                current_part_required_quantity: 3,
                machine_compatibilities: [
                    {
                        part_id: partsSeed.materials.resistencia20.id,
                    },
                    {
                        part_id: partsSeed.materials.resistencia30.id,
                    },
                ],
            });

        const componente3 =
            await this.machineComponentsService.upsertMachineComponent({
                name: 'Contactor',
                machine_id: cmdSection1.machine_id,
                machine_section_id: cmdSection1.id,
                current_part_id: partsSeed.materials.contactor500.id,
                current_part_required_quantity: 1,
                machine_compatibilities: [
                    {
                        part_id: partsSeed.materials.contactor400.id,
                    },
                    {
                        part_id: partsSeed.materials.contactor500.id,
                    },
                ],
            });

        // seccion 2
        const cmdSection2 =
            await this.machineSectionsService.upsertMachineSection({
                machine_id: cmd.id,
                name: 'Cabezal',
            });
        const componente4 =
            await this.machineComponentsService.upsertMachineComponent({
                name: 'Contactor',
                machine_id: cmdSection2.machine_id,
                machine_section_id: cmdSection2.id,
                current_part_id: partsSeed.materials.contactor400.id,
                current_part_required_quantity: 1,
                machine_compatibilities: [
                    {
                        part_id: partsSeed.materials.contactor400.id,
                    },
                ],
            });

        const componente5 =
            await this.machineComponentsService.upsertMachineComponent({
                name: 'Banda',
                machine_id: cmdSection2.machine_id,
                machine_section_id: cmdSection2.id,
                current_part_id: partsSeed.materials.banda600.id,
                current_part_required_quantity: 2,
                machine_compatibilities: [
                    {
                        part_id: partsSeed.materials.banda600.id,
                    },
                    {
                        part_id: partsSeed.materials.banda700.id,
                    },
                ],
            });

        // seccion 3
        const cmdSection3 =
            await this.machineSectionsService.upsertMachineSection({
                machine_id: cmd.id,
                name: 'Seccion 3',
            });

        const componente6 =
            await this.machineComponentsService.upsertMachineComponent({
                name: 'Componente 6',
                machine_id: cmdSection3.machine_id,
                machine_section_id: cmdSection3.id,
                current_part_id: partsSeed.materials.tornillo1.id,
                current_part_required_quantity: 5,
                machine_compatibilities: [
                    {
                        part_id: partsSeed.materials.tornillo2.id,
                    },
                    {
                        part_id: partsSeed.materials.tornillo1.id,
                    },
                ],
            });

        const componente7 =
            await this.machineComponentsService.upsertMachineComponent({
                name: 'Componente 7',
                machine_id: cmdSection3.machine_id,
                machine_section_id: cmdSection3.id,
                current_part_id: partsSeed.materials.gomas1.id,
                current_part_required_quantity: 8,
                machine_compatibilities: [
                    {
                        part_id: partsSeed.materials.gomas1.id,
                    },
                ],
            });

        const componente8 =
            await this.machineComponentsService.upsertMachineComponent({
                name: 'Componente 8',
                machine_id: cmdSection3.machine_id,
                machine_section_id: cmdSection3.id,
                current_part_id: partsSeed.materials.tornillo3.id,
                current_part_required_quantity: 20,
                machine_compatibilities: [
                    {
                        part_id: partsSeed.materials.tornillo2.id,
                    },
                    {
                        part_id: partsSeed.materials.tornillo1.id,
                    },
                    {
                        part_id: partsSeed.materials.tornillo3.id,
                    },
                ],
            });

        const componente9 =
            await this.machineComponentsService.upsertMachineComponent({
                name: 'Componente 9',
                machine_id: cmdSection3.machine_id,
                machine_section_id: cmdSection3.id,
                current_part_id: partsSeed.materials.contactor900.id,
                current_part_required_quantity: 1,
                machine_compatibilities: [
                    {
                        part_id: partsSeed.materials.contactor900.id,
                    },
                ],
            });

        // seccion 4
        const cmdSection4 =
            await this.machineSectionsService.upsertMachineSection({
                machine_id: cmd.id,
                name: 'Seccion 4',
            });

        const componente10 =
            await this.machineComponentsService.upsertMachineComponent({
                name: 'Componente 10',
                machine_id: cmdSection4.machine_id,
                machine_section_id: cmdSection4.id,
                current_part_id: partsSeed.materials.banda800.id,
                current_part_required_quantity: 3,
                machine_compatibilities: [
                    {
                        part_id: partsSeed.materials.banda800.id,
                    },
                ],
            });

        const componente11 =
            await this.machineComponentsService.upsertMachineComponent({
                name: 'Componente 11',
                machine_id: cmdSection4.machine_id,
                machine_section_id: null,
                current_part_id: partsSeed.materials.balero1.id,
                current_part_required_quantity: 3,
                machine_compatibilities: [
                    {
                        part_id: partsSeed.materials.balero1.id,
                    },
                ],
            });

        const componente12 =
            await this.machineComponentsService.upsertMachineComponent({
                name: 'Componente 12',
                machine_id: cmdSection4.machine_id,
                machine_section_id: null,
                current_part_id: partsSeed.materials.piston1.id,
                current_part_required_quantity: 10,
                machine_compatibilities: [
                    {
                        part_id: partsSeed.materials.piston1.id,
                    },
                    {
                        part_id: partsSeed.materials.piston2.id,
                    },
                ],
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
            unassigned_components: {
                componente11,
                componente12,
            },
        };
    }

    async getMachines(partsSeed: PartsSeed): Promise<MachinesSeed> {
        const cmd = await this.getCmd(partsSeed);

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
