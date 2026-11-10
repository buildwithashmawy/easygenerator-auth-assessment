import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Connection } from 'mongoose';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  /** Liveness + database readiness. Used by Railway's health check. */
  @Get()
  @ApiOkResponse({ schema: { example: { status: 'ok', database: 'up', uptime: 42.1 } } })
  async check() {
    try {
      await this.connection.db?.admin().ping();
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'down' });
    }
    return { status: 'ok', database: 'up', uptime: Math.round(process.uptime() * 10) / 10 };
  }
}
