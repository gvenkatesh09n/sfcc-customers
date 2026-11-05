import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** SFCC customer_no - our natural key, makes the webhook idempotent. */
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
  birthday: string;

  @Column({ nullable: true })
  registeredAt: string;

  /** Original SFCC payload, kept for audit/debugging. */
  @Column({ type: 'simple-json', nullable: true })
  rawPayload: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
