import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customers/customer.entity';
import { CustomersModule } from './customers/customers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('DATABASE_URL'),
        // Render's external URL requires SSL; the internal URL does not.
        ssl:
          config.get('DB_SSL', 'true') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        entities: [Customer],
        synchronize: true, // fine for a demo; use migrations in real envs
      }),
    }),
    CustomersModule,
  ],
})
export class AppModule {}
