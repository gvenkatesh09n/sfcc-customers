process.env.DB_PATH = ':memory:';
process.env.SFCC_API_KEY = 'test-key';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('SFCC customers (e2e)', () => {
  let app: INestApplication;
  const payload = {
    customerNo: '00012345',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    registeredAt: '2026-11-05T10:00:00Z',
  };

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });
  afterAll(() => app.close());

  const http = () => request(app.getHttpServer());

  it('rejects a missing API key', () =>
    http().post('/sfcc/customers').send(payload).expect(401));

  it('rejects an invalid payload', () =>
    http()
      .post('/sfcc/customers')
      .set('x-api-key', 'test-key')
      .send({ customerNo: '1', email: 'not-an-email' })
      .expect(400));

  it('creates, then updates on duplicate delivery', async () => {
    const first = await http()
      .post('/sfcc/customers')
      .set('x-api-key', 'test-key')
      .send(payload)
      .expect(200);
    expect(first.body.status).toBe('created');

    const second = await http()
      .post('/sfcc/customers')
      .set('x-api-key', 'test-key')
      .send({ ...payload, firstName: 'Janet' })
      .expect(200);
    expect(second.body.status).toBe('updated');
    expect(second.body.id).toBe(first.body.id);

    const list = await http().get('/customers').expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].firstName).toBe('Janet');
    await http().get(`/customers/${first.body.id}`).expect(200);
    await http().get('/customers/nope').expect(404);
  });
});
