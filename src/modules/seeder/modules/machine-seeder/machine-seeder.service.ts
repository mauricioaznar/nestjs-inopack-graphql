import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { MachinesService } from '../../../entities/machines/machines.service';
import { MachinesSeed } from '../../types/machines-seed';

@Injectable()
export class MachineSeederService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly machinesService: MachinesService,
  ) {}

  async getMachines(): Promise<MachinesSeed> {
    const cmd = await this.machinesService.getMachine({
      id: 1,
    });
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
