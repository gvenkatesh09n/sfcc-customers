import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

/** SFCC sends a shared secret in the `x-api-key` header. */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const provided = String(req.headers['x-api-key'] ?? '');
    const expected = this.config.get<string>('SFCC_API_KEY', 'local-dev-key');
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      this.logger.warn(`Rejected request with invalid API key from ${req.ip}`);
      throw new UnauthorizedException('Invalid API key');
    }
    return true;
  }
}
