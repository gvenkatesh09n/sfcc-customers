import {
  IsIn,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Same envelope SFCC (int_google_pubsub) publishes and b2b-middleware consumes. */
export class EventEnvelopeDto {
  @IsString()
  eventType: string;

  @IsString()
  eventVersion: string;

  @IsISO8601()
  occurredAt: string;

  @IsIn(['sfcc', 'b2bwave', 'gbq'])
  source: string;

  @IsUUID('4')
  correlationId: string;

  @IsString()
  idempotencyKey: string;

  /** SFCC-native keys, e.g. `customer__customer-no`, `customer_profile_email`. */
  @IsObject()
  payload: Record<string, unknown>;
}

class PubSubMessageDto {
  /** Base64-encoded JSON of the EventEnvelope. */
  @IsString()
  data: string;

  @IsString()
  messageId: string;

  @IsOptional()
  @IsString()
  publishTime?: string;
}

/** Body Google Pub/Sub POSTs to a push endpoint. */
export class PubSubPushDto {
  @ValidateNested()
  @Type(() => PubSubMessageDto)
  message: PubSubMessageDto;

  @IsOptional()
  @IsString()
  subscription?: string;
}
