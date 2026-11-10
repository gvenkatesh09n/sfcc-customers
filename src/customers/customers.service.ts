import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { EventEnvelopeDto } from './dto/event-envelope.dto';
import { mapSfccPayload } from './sfcc-payload.mapper';

export const ACCOUNT_CREATED = 'dropshipper.account.created';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @InjectRepository(Customer) private readonly repo: Repository<Customer>,
  ) {}

  /**
   * Apply an SFCC event envelope. Only `dropshipper.account.created` is stored;
   * other event types are acknowledged and ignored.
   * Upserts by customerNo, so retries / duplicate deliveries are safe.
   */
  async handleEvent(envelope: EventEnvelopeDto) {
    if (envelope.eventType !== ACCOUNT_CREATED) {
      this.logger.warn(
        `Ignoring unsupported event ${envelope.eventType} (${envelope.idempotencyKey})`,
      );
      return { status: 'ignored' as const };
    }

    const fields = mapSfccPayload(envelope.payload);
    if (!fields.customerNo || !fields.email) {
      throw new BadRequestException(
        'payload must contain customer__customer-no and customer_profile_email',
      );
    }

    const existing = await this.repo.findOneBy({
      customerNo: fields.customerNo,
    });
    const customer = this.repo.create({
      ...existing,
      ...fields,
      lastEventType: envelope.eventType,
      lastIdempotencyKey: envelope.idempotencyKey,
      lastCorrelationId: envelope.correlationId,
      lastOccurredAt: envelope.occurredAt,
      rawPayload: envelope.payload,
    });
    const saved = await this.repo.save(customer);
    this.logger.log(
      `${existing ? 'Updated' : 'Created'} customer ${fields.customerNo} ` +
        `[correlationId=${envelope.correlationId}]`,
    );
    return {
      status: existing ? ('updated' as const) : ('created' as const),
      id: saved.id,
    };
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  /**
   * Case-insensitive email lookup. Email is not unique in our table, so this
   * returns every match (usually 0 or 1).
   */
  findByEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      throw new BadRequestException('email must not be empty');
    }
    return this.repo
      .createQueryBuilder('c')
      .where('LOWER(c.email) = :email', { email: normalized })
      .orderBy('c.createdAt', 'DESC')
      .getMany();
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
