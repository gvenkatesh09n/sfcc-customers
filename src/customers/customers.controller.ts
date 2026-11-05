import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ApiKeyGuard } from '../common/api-key.guard';
import { CustomersService } from './customers.service';
import { EventEnvelopeDto, PubSubPushDto } from './dto/event-envelope.dto';

@Controller()
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  /** Direct call: body is the SFCC event envelope as JSON. */
  @Post('sfcc/customers')
  @UseGuards(ApiKeyGuard)
  @HttpCode(200)
  receive(@Body() envelope: EventEnvelopeDto) {
    return this.customers.handleEvent(envelope);
  }

  /**
   * Pub/Sub push: same envelope, base64-encoded in message.data.
   * Demo auth is the API key; real push subscriptions send an OIDC token (TODO month 2).
   */
  @Post('pubsub/push')
  @UseGuards(ApiKeyGuard)
  @HttpCode(200)
  async push(@Body() body: PubSubPushDto) {
    let decoded: unknown;
    try {
      decoded = JSON.parse(
        Buffer.from(body.message.data, 'base64').toString('utf8'),
      );
    } catch {
      throw new BadRequestException('message.data is not base64-encoded JSON');
    }
    const envelope = plainToInstance(EventEnvelopeDto, decoded);
    const errors = await validate(envelope);
    if (errors.length) {
      throw new BadRequestException(
        errors.flatMap((e) => Object.values(e.constraints ?? {})),
      );
    }
    return this.customers.handleEvent(envelope);
  }

  @Get('customers')
  list() {
    return this.customers.findAll();
  }

  @Get('customers/:id')
  get(@Param('id') id: string) {
    return this.customers.findOne(id);
  }
}
