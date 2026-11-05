import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  let service: CustomersService;
  const repo = {
    findOneBy: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => ({ id: 'uuid-1', ...x })),
    find: jest.fn(),
  };
  const dto = { customerNo: '1', email: 'a@b.com', firstName: 'A' };

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

  it('creates a customer when customerNo is new', async () => {
    repo.findOneBy.mockResolvedValue(null);
    const res = await service.upsertFromSfcc(dto);
    expect(res.created).toBe(true);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('updates the existing customer on duplicate delivery', async () => {
    repo.findOneBy.mockResolvedValue({ id: 'uuid-1', customerNo: '1' });
    const res = await service.upsertFromSfcc({ ...dto, firstName: 'B' });
    expect(res.created).toBe(false);
    expect(res.customer.id).toBe('uuid-1');
    expect(res.customer.firstName).toBe('B');
  });

  it('throws NotFound for an unknown id', async () => {
    repo.findOneBy.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
