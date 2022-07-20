import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/modules/prisma/prisma.service';
import { Role } from '../../common/dto/entities/auth/role.dto';

@Injectable()
export class RoleService {
    constructor(private prisma: PrismaService) {}

    async findAll(): Promise<Role[]> {
        return this.prisma.roles.findMany();
    }
}
