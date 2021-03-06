import {
    BadRequestException,
    Controller,
    Get,
    NotFoundException,
    Param,
    Res,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { Public } from '../auth/decorators/public.decorator';
import { JwtService } from '@nestjs/jwt';
import * as ejs from 'ejs';
import * as pdf from 'html-pdf';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';
import { OrderSaleService } from '../sales/order-sale/order-sale.service';
import { formatDate, formatFloat } from '../../common/helpers';
import { PrismaService } from '../../common/modules/prisma/prisma.service';

@Controller('files')
export class FilesController {
    constructor(
        private readonly fileService: FilesService,
        private jwtService: JwtService,
        private orderSaleService: OrderSaleService,
        private prismaService: PrismaService,
    ) {}

    @Get('orderSales/:token/:orderSaleId')
    @Public()
    async getPdf(
        @Res() res: Response,
        @Param('token') token: string,
        @Param('orderSaleId') orderSaleFileName: string,
    ) {
        try {
            this.jwtService.verify(token);
        } catch (e) {
            throw new BadRequestException('Invalid token');
        }

        if (!orderSaleFileName.includes('.')) {
            throw new BadRequestException(
                'Invalid file (expected `23223.pdf`)',
            );
        }

        const compiled = ejs.compile(
            fs.readFileSync(
                path.join(
                    path.resolve(process.cwd()),
                    'src',
                    'assets',
                    'order-sale-receipt.html',
                ),
                'utf8',
            ),
        );
        const orderSaleId = Number(orderSaleFileName.split('.')[0]);

        const orderSale = await this.orderSaleService.getOrderSale({
            orderSaleId: orderSaleId,
        });

        if (!orderSale) {
            throw new NotFoundException();
        }

        const client = await this.orderSaleService.getClient({
            order_sale_id: orderSaleId,
        });

        if (!client) {
            throw new NotFoundException();
        }

        const orderSaleProducts =
            await this.prismaService.order_sale_products.findMany({
                include: {
                    products: true,
                },
                where: {
                    order_sale_id: orderSaleId,
                },
            });

        const total = await this.orderSaleService.getOrderSaleProductsTotal({
            order_sale_id: orderSaleId,
        });

        const dateEmitted = formatDate(orderSale.date);

        const html = compiled({
            title: 'EJS',
            clientName: client.name,
            orderSaleProducts: orderSaleProducts.map((product) => {
                return {
                    ...product,
                    kilos: formatFloat(product.kilos),
                    kilo_price: formatFloat(product.kilo_price),
                    groups: formatFloat(product.groups),
                    total: formatFloat(product.kilos * product.kilo_price),
                };
            }),
            total: formatFloat(total),
            dateEmitted: dateEmitted,
            orderCode: orderSale.order_code,
            receiptType: orderSale.order_sale_receipt_type_id === 1 ? 'N' : 'F',
        });

        const createPDF = (html) =>
            new Promise((resolve, reject) => {
                pdf.create(html, {}).toBuffer((err, buffer) => {
                    if (err !== null) {
                        reject(err);
                    } else {
                        resolve(buffer);
                    }
                });
            });

        const pdfFile = (await createPDF(html)) as any;

        return res
            .set({ 'Content-Length': pdfFile.size })
            .set({ 'Content-Type': 'application/pdf' })
            .set({
                'Content-Disposition': `inline; filename=${orderSale.order_code}.pdf`,
            })
            .send(pdfFile);
    }

    @Public()
    @Get(':token/:filename')
    async getFile(
        @Param('token') token,
        @Param('filename') filename,
        @Res() res,
    ) {
        try {
            this.jwtService.verify(token);
        } catch (e) {
            throw new BadRequestException('Invalid token');
        }
        return res.sendFile(filename, { root: 'uploads/images' });
    }
}
