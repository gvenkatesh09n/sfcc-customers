import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { SfccCustomerDto } from './dto/sfcc-customer.dto';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @InjectRepository(Customer) private readonly repo: Repository<Customer>,
  ) {}

  /** Insert or update by customerNo, so SFCC retries/duplicates are safe. */
  async upsertFromSfcc(dto: SfccCustomerDto) {
    const existing = await this.repo.findOneBy({ customerNo: dto.customerNo });
    const customer = this.repo.create({
      ...existing,
      ...dto,
      rawPayload: { ...dto },
    });
    const saved = await this.repo.save(customer);
    this.logger.log(
      `${existing ? 'Updated' : 'Created'} customer ${dto.customerNo}`,
    );
    return { created: !existing, customer: saved };
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const customer = await this.repo.findOneBy({ id });
    if (!customer) {
      this.logger.warn(`Customer ${id} not found`);
      throw new NotFoundException(`Customer ${id} not found`);
    }
    return customer;
  }
}
