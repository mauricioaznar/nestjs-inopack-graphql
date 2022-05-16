import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../../common/constants/jwt';
import { OrderSaleService } from '../entities/sales/order-sale/order-sale.service';
import { PrismaService } from '../../common/services/prisma/prisma.service';

@Module({
    imports: [
        JwtModule.register({
            secret: jwtConstants.authSecret,
            signOptions: { expiresIn: jwtConstants.fileExpiresIn },
        }),
    ],
    controllers: [FilesController],
    providers: [FilesService, OrderSaleService, PrismaService],
    exports: [FilesService],
})
export class FilesModule {}
