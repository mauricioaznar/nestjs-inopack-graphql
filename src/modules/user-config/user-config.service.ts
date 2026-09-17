import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/modules/prisma/prisma.service';
import { UserConfig } from '../../common/dto/entities';
import {
    getCreatedAtProperty,
    getUpdatedAtProperty,
} from '../../common/helpers';

@Injectable()
export class UserConfigService {
    constructor(private prisma: PrismaService) {}

    // Read-or-create: every user has exactly one config row (unique user_id), so a
    // user who has never touched their settings still gets sensible defaults.
    async getForUser({ user_id }: { user_id: number }): Promise<UserConfig> {
        const existing = await this.prisma.user_config.findUnique({
            where: { user_id },
        });
        if (existing) return existing;

        return this.prisma.user_config.create({
            data: {
                user_id,
                dark_mode: false,
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
            },
        });
    }

    async setDarkMode({
        user_id,
        dark_mode,
    }: {
        user_id: number;
        dark_mode: boolean;
    }): Promise<UserConfig> {
        return this.prisma.user_config.upsert({
            where: { user_id },
            create: {
                user_id,
                dark_mode,
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
            },
            update: {
                dark_mode,
                ...getUpdatedAtProperty(),
            },
        });
    }
}
