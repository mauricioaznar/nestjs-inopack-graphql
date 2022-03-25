import { INestApplication } from '@nestjs/common';
import { setupApp } from '../common/__tests__/helpers/setup-app';
import request from 'supertest';
import { adminUser } from '../common/__tests__/objects/users';

describe('Users', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await setupApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('user logs in', async () => {
    const username = adminUser.username;
    const password = adminUser.password;
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `mutation {
            login(
              loginInput: {username: "${username}", password: "${password}"})
                {
                  accessToken
                }
              }`,
      });

    expect(response.body.data.login.accessToken).toBeDefined();
  });
});
