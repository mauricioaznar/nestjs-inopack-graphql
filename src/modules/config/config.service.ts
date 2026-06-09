import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/modules/prisma/prisma.service';
import { UpdateUserConfigInput, UserConfig } from '../../common/dto/entities';

@Injectable()
export class ConfigService {
    constructor(private prisma: PrismaService) {}

    async getMyConfig(userId: number): Promise<UserConfig> {
        const now = new Date();
        return this.prisma.user_configs.upsert({
            where: { user_id: userId },
            create: {
                user_id: userId,
                color_mode: 'light',
                created_at: now,
                updated_at: now,
            },
            update: {},
        });
    }

    async updateMyConfig(
        userId: number,
        input: UpdateUserConfigInput,
    ): Promise<UserConfig> {
        const now = new Date();
        return this.prisma.user_configs.upsert({
            where: { user_id: userId },
            create: {
                user_id: userId,
                color_mode: input.color_mode,
                created_at: now,
                updated_at: now,
            },
            update: {
                color_mode: input.color_mode,
                updated_at: now,
            },
        });
    }
}
