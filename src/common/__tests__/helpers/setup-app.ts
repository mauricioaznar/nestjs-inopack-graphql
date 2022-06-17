import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { appConfig } from '../../helpers/app/app-config';
import { INestApplication } from '@nestjs/common';

export async function setupApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    await app.init();
    await appConfig({ app });
    return app;
}
