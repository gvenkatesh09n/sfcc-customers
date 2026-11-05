import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from '../common/api-key.guard';
import { CustomersService } from './customers.service';
import { SfccCustomerDto } from './dto/sfcc-customer.dto';

@Controller()
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  /** Endpoint SFCC calls after a customer registers. */
  @Post('sfcc/customers')
  @UseGuards(ApiKeyGuard)
  @HttpCode(200)
  async receive(@Body() body: SfccCustomerDto) {
    const { created, customer } = await this.customers.upsertFromSfcc(body);
    return { status: created ? 'created' : 'updated', id: customer.id };
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
