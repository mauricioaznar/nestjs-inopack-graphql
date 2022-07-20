import request from 'supertest';
import { adminUser } from '../objects/auth/users';
import { INestApplication } from '@nestjs/common';

export async function getAdminToken(app: INestApplication) {
    const email = adminUser.email;
    const password = adminUser.password;
    const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
            query: `mutation {
            login(
              loginInput: {email: "${email}", password: "${password}"})
                {
                  accessToken
                }
              }`,
        });

    const access_token = response.body?.data?.login?.accessToken;

    expect(access_token).toBeDefined();

    return { Authorization: `Bearer ${access_token}` };
}
