import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { ACCOUNT_CREATED, CustomersService } from './customers.service';
import { EventEnvelopeDto } from './dto/event-envelope.dto';

const envelope = (over: Partial<EventEnvelopeDto> = {}): EventEnvelopeDto => ({
  eventType: ACCOUNT_CREATED,
  eventVersion: '1.0',
  occurredAt: '2026-11-05T10:00:00Z',
  source: 'sfcc',
  correlationId: 'b2c3d4e5-f6a7-4901-8cde-f12345678901',
  idempotencyKey: `sfcc-00012345-${ACCOUNT_CREATED}`,
  payload: {
    'customer__customer-no': '00012345',
    'customer__profile__first-name': 'Jane',
    'customer__profile__last-name': 'Doe',
    customer_profile_email: 'jane@example.com',
    customer_addresses_address_phone: '',
    'Customer_addresses_address_country-code': 'NL',
    Language: 'nl',
  },
  ...over,
});

describe('CustomersService', () => {
  let service: CustomersService;
  const repo = {
    findOneBy: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => ({ id: 'uuid-1', ...x })),
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: getRepositoryToken(Customer), useValue: repo },
      ],
    }).compile();
    service = mod.get(CustomersService);
  });

  it('maps SFCC keys and creates a customer when customerNo is new', async () => {
    repo.findOneBy.mockResolvedValue(null);
    const res = await service.handleEvent(envelope());
    expect(res.status).toBe('created');
    const saved = repo.save.mock.calls[0][0];
    expect(saved).toMatchObject({
      customerNo: '00012345',
      firstName: 'Jane',
      email: 'jane@example.com',
      billingCountry: 'NL',
      language: 'nl',
      phone: null, // SFCC sends '' for empty values
      lastIdempotencyKey: `sfcc-00012345-${ACCOUNT_CREATED}`,
    });
  });

  it('updates the existing customer on duplicate delivery', async () => {
    repo.findOneBy.mockResolvedValue({ id: 'uuid-1', customerNo: '00012345' });
    const res = await service.handleEvent(envelope());
    expect(res).toEqual({ status: 'updated', id: 'uuid-1' });
  });

  it('ignores unsupported event types without touching the db', async () => {
    const res = await service.handleEvent(
      envelope({ eventType: 'dropshipper.kyc.regular.updated' }),
    );
    expect(res.status).toBe('ignored');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('rejects a payload without customer number or email', async () => {
    await expect(
      service.handleEvent(envelope({ payload: { Language: 'nl' } })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws NotFound for an unknown id', async () => {
    repo.findOneBy.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
