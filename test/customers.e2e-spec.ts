process.env.DB_PATH = ':memory:';
process.env.SFCC_API_KEY = 'test-key';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

const envelope = (over: Record<string, unknown> = {}) => ({
  eventType: 'dropshipper.account.created',
  eventVersion: '1.0',
  occurredAt: '2026-11-05T10:00:00Z',
  source: 'sfcc',
  correlationId: 'b2c3d4e5-f6a7-4901-8cde-f12345678901',
  idempotencyKey: 'sfcc-00012345-dropshipper.account.created',
  payload: {
    'customer__customer-no': '00012345',
    'customer__profile__first-name': 'Jane',
    'customer__profile__last-name': 'Doe',
    customer_profile_email: 'jane@example.com',
    'customer_addresses_address_company-name': 'Jane BV',
    'Customer_addresses_address_country-code': 'NL',
    country__code: 'NL',
    Language: 'nl',
    vat: 'NL123456789B01',
  },
  ...over,
});

describe('SFCC customers (e2e)', () => {
  let app: INestApplication;

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
  const key = { 'x-api-key': 'test-key' };

  it('rejects a missing API key', () =>
    http().post('/sfcc/customers').send(envelope()).expect(401));

  it('rejects an invalid envelope', () =>
    http()
      .post('/sfcc/customers')
      .set(key)
      .send({ eventType: 'x' })
      .expect(400));

  it('stores the customer, then updates on duplicate delivery', async () => {
    const first = await http()
      .post('/sfcc/customers')
      .set(key)
      .send(envelope())
      .expect(200);
    expect(first.body.status).toBe('created');

    const dup = envelope();
    dup.payload['customer__profile__first-name'] = 'Janet';
    const second = await http()
      .post('/sfcc/customers')
      .set(key)
      .send(dup)
      .expect(200);
    expect(second.body).toEqual({ status: 'updated', id: first.body.id });

    const list = await http().get('/customers').expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({
      customerNo: '00012345',
      firstName: 'Janet',
      companyName: 'Jane BV',
      billingCountry: 'NL',
      vat: 'NL123456789B01',
    });
    await http().get(`/customers/${first.body.id}`).expect(200);
    await http().get('/customers/nope').expect(404);
  });

  it('accepts a Pub/Sub push body with base64 data', async () => {
    const env = envelope({
      idempotencyKey: 'sfcc-00099999-dropshipper.account.created',
    });
    (env.payload as Record<string, string>)['customer__customer-no'] = '00099999';
    const body = {
      message: {
        data: Buffer.from(JSON.stringify(env)).toString('base64'),
        messageId: '123',
      },
      subscription: 'projects/p/subscriptions/s',
    };
    const res = await http().post('/pubsub/push').set(key).send(body).expect(200);
    expect(res.body.status).toBe('created');

    await http()
      .post('/pubsub/push')
      .set(key)
      .send({ message: { data: 'not-json', messageId: '1' } })
      .expect(400);
  });
});
