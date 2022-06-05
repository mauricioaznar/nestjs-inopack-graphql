import { Injectable } from '@nestjs/common';
import { MachinesService } from '../../../entities/maintenance/machines/machines.service';
import { MachinesSeed } from '../../types/machines-seed';
import { MachineSectionsService } from '../../../entities/maintenance/machine-sections/machine-sections.service';
import { MachinePartsService } from '../../../entities/maintenance/machine-parts/machine-parts.service';
import { SparesSeed } from '../../types/spares-seed';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Injectable()
export class MachineSeederService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly machinesService: MachinesService,
        private readonly machineSectionsService: MachineSectionsService,
        private readonly machinePartsService: MachinePartsService,
    ) {}

    async getCmd(sparesSeed: SparesSeed): Promise<MachinesSeed['cmd']> {
        const cmd = await this.machinesService.getMachine({
            id: 1,
        });

        // seccion 1
        const cmdSection1 =
            await this.machineSectionsService.upsertMachineSection({
                machine_id: cmd.id,
                name: 'Tablero',
            });
        const parte1 = await this.machinePartsService.upsertMachinePart({
            name: 'Bandas',
            machine_id: cmdSection1.machine_id,
            machine_section_id: cmdSection1.id,
            current_spare_id: sparesSeed.materials.banda700.id,
            current_spare_required_quantity: 2,
            machine_compatibilities: [
                {
                    spare_id: sparesSeed.materials.banda700.id,
                },
                {
                    spare_id: sparesSeed.materials.banda800.id,
                },
            ],
        });

        const parte2 = await this.machinePartsService.upsertMachinePart({
            name: 'Resistencias',
            machine_id: cmdSection1.machine_id,
            machine_section_id: cmdSection1.id,
            current_spare_id: sparesSeed.materials.resistencia20.id,
            current_spare_required_quantity: 3,
            machine_compatibilities: [
                {
                    spare_id: sparesSeed.materials.resistencia20.id,
                },
                {
                    spare_id: sparesSeed.materials.resistencia30.id,
                },
            ],
        });

        const parte3 = await this.machinePartsService.upsertMachinePart({
            name: 'Contactor',
            machine_id: cmdSection1.machine_id,
            machine_section_id: cmdSection1.id,
            current_spare_id: sparesSeed.materials.contactor500.id,
            current_spare_required_quantity: 1,
            machine_compatibilities: [
                {
                    spare_id: sparesSeed.materials.contactor400.id,
                },
                {
                    spare_id: sparesSeed.materials.contactor500.id,
                },
            ],
        });

        // seccion 2
        const cmdSection2 =
            await this.machineSectionsService.upsertMachineSection({
                machine_id: cmd.id,
                name: 'Cabezal',
            });
        const parte4 = await this.machinePartsService.upsertMachinePart({
            name: 'Contactor',
            machine_id: cmdSection2.machine_id,
            machine_section_id: cmdSection2.id,
            current_spare_id: sparesSeed.materials.contactor400.id,
            current_spare_required_quantity: 1,
            machine_compatibilities: [
                {
                    spare_id: sparesSeed.materials.contactor400.id,
                },
            ],
        });

        const parte5 = await this.machinePartsService.upsertMachinePart({
            name: 'Banda',
            machine_id: cmdSection2.machine_id,
            machine_section_id: cmdSection2.id,
            current_spare_id: sparesSeed.materials.banda600.id,
            current_spare_required_quantity: 2,
            machine_compatibilities: [
                {
                    spare_id: sparesSeed.materials.banda600.id,
                },
                {
                    spare_id: sparesSeed.materials.banda700.id,
                },
            ],
        });

        // seccion 3
        const cmdSection3 =
            await this.machineSectionsService.upsertMachineSection({
                machine_id: cmd.id,
                name: 'Seccion 3',
            });

        const parte6 = await this.machinePartsService.upsertMachinePart({
            name: 'Parte 6',
            machine_id: cmdSection3.machine_id,
            machine_section_id: cmdSection3.id,
            current_spare_id: sparesSeed.materials.tornillo1.id,
            current_spare_required_quantity: 5,
            machine_compatibilities: [
                {
                    spare_id: sparesSeed.materials.tornillo2.id,
                },
                {
                    spare_id: sparesSeed.materials.tornillo1.id,
                },
            ],
        });

        const parte7 = await this.machinePartsService.upsertMachinePart({
            name: 'Parte 7',
            machine_id: cmdSection3.machine_id,
            machine_section_id: cmdSection3.id,
            current_spare_id: sparesSeed.materials.gomas1.id,
            current_spare_required_quantity: 8,
            machine_compatibilities: [
                {
                    spare_id: sparesSeed.materials.gomas1.id,
                },
            ],
        });

        const parte8 = await this.machinePartsService.upsertMachinePart({
            name: 'Parte 8',
            machine_id: cmdSection3.machine_id,
            machine_section_id: cmdSection3.id,
            current_spare_id: sparesSeed.materials.tornillo3.id,
            current_spare_required_quantity: 20,
            machine_compatibilities: [
                {
                    spare_id: sparesSeed.materials.tornillo2.id,
                },
                {
                    spare_id: sparesSeed.materials.tornillo1.id,
                },
                {
                    spare_id: sparesSeed.materials.tornillo3.id,
                },
            ],
        });

        const parte9 = await this.machinePartsService.upsertMachinePart({
            name: 'Parte 9',
            machine_id: cmdSection3.machine_id,
            machine_section_id: cmdSection3.id,
            current_spare_id: sparesSeed.materials.contactor900.id,
            current_spare_required_quantity: 1,
            machine_compatibilities: [
                {
                    spare_id: sparesSeed.materials.contactor900.id,
                },
            ],
        });

        // seccion 4
        const cmdSection4 =
            await this.machineSectionsService.upsertMachineSection({
                machine_id: cmd.id,
                name: 'Seccion 4',
            });

        const parte10 = await this.machinePartsService.upsertMachinePart({
            name: 'Parte 10',
            machine_id: cmdSection4.machine_id,
            machine_section_id: cmdSection4.id,
            current_spare_id: sparesSeed.materials.banda800.id,
            current_spare_required_quantity: 3,
            machine_compatibilities: [
                {
                    spare_id: sparesSeed.materials.banda800.id,
                },
            ],
        });

        const parte11 = await this.machinePartsService.upsertMachinePart({
            name: 'Parte 11',
            machine_id: cmdSection4.machine_id,
            machine_section_id: null,
            current_spare_id: sparesSeed.materials.balero1.id,
            current_spare_required_quantity: 3,
            machine_compatibilities: [
                {
                    spare_id: sparesSeed.materials.balero1.id,
                },
            ],
        });

        const parte12 = await this.machinePartsService.upsertMachinePart({
            name: 'Parte 12',
            machine_id: cmdSection4.machine_id,
            machine_section_id: null,
            current_spare_id: sparesSeed.materials.piston1.id,
            current_spare_required_quantity: 10,
            machine_compatibilities: [
                {
                    spare_id: sparesSeed.materials.piston1.id,
                },
                {
                    spare_id: sparesSeed.materials.piston2.id,
                },
            ],
        });

        return {
            machine: cmd,
            sections: {
                seccion1: {
                    section: cmdSection1,
                    parts: {
                        parte1,
                        parte2,
                        parte3,
                    },
                },
                seccion2: {
                    section: cmdSection2,
                    parts: {
                        parte4,
                        parte5,
                    },
                },
                seccion3: {
                    section: cmdSection3,
                    parts: {
                        parte6,
                        parte7,
                        parte8,
                        parte9,
                    },
                },
                seccion4: {
                    section: cmdSection4,
                    parts: {
                        parte10,
                    },
                },
            },
            unassigned_parts: {
                parte11,
                parte12,
            },
        };
    }

    async getMachines(sparesSeed: SparesSeed): Promise<MachinesSeed> {
        const cmd = await this.getCmd(sparesSeed);

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
