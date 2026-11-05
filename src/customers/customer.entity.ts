import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Customer created from the SFCC `dropshipper.account.created` event.
 * Column names are our own; see sfcc-payload.mapper.ts for the SFCC key each comes from.
 */
@Entity()
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** SFCC customer_no - natural key, makes the event handler idempotent. */
  @Column({ unique: true })
  customerNo: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  companyName: string;

  @Column({ nullable: true })
  billingCountry: string;

  @Column({ nullable: true })
  sellingCountry: string;

  @Column({ nullable: true })
  address1: string;

  @Column({ nullable: true })
  address2: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  stateCode: string;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  district: string;

  @Column({ nullable: true })
  vat: string;

  @Column({ nullable: true })
  language: string;

  @Column({ nullable: true })
  sapDebtorId: string;

  @Column({ nullable: true })
  sapCustomerNo: string;

  /** Envelope metadata of the last event applied. */
  @Column({ nullable: true })
  lastEventType: string;

  @Column({ nullable: true })
  lastIdempotencyKey: string;

  @Column({ nullable: true })
  lastCorrelationId: string;

  @Column({ nullable: true })
  lastOccurredAt: string;

  /** Original SFCC payload, kept for audit/debugging. */
  @Column({ type: 'simple-json', nullable: true })
  rawPayload: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
