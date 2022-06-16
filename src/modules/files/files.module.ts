import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../../common/constants/jwt';
import { OrderSaleService } from '../sales/order-sale/order-sale.service';
import { OrderRequestRemainingProductsService } from '../../common/services/entities/order-request-remaining-products-service';

@Module({
    imports: [
        JwtModule.register({
            secret: jwtConstants.authSecret,
            signOptions: { expiresIn: jwtConstants.fileExpiresIn },
        }),
    ],
    controllers: [FilesController],
    providers: [
        FilesService,
        OrderSaleService,
        OrderRequestRemainingProductsService,
    ],
    exports: [FilesService],
})
export class FilesModule {}
