import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { AuthModule } from './auth/auth.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { Env, validateEnv } from './config/env.validation';
import { HealthController } from './health/health.controller';
import { UsersModule } from './users/users.module';

/** Built web app (web/dist). Served by Nest in production so the app is single-origin. */
const WEB_DIST = join(__dirname, '..', '..', 'web', 'dist');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const isProd = config.get('NODE_ENV', { infer: true }) === 'production';
        return {
          pinoHttp: {
            level: config.get('LOG_LEVEL', { infer: true }),
            genReqId: (req, res) => {
              const id = (req.headers['x-request-id'] as string) || randomUUID();
              res.setHeader('x-request-id', id);
              return id;
            },
            // Never log credentials or session material.
            redact: {
              paths: [
                'req.headers.cookie',
                'req.headers.authorization',
                'res.headers["set-cookie"]',
                'req.body.password',
              ],
              censor: '[redacted]',
            },
            autoLogging: { ignore: (req) => req.url === '/api/health' },
            transport: isProd ? undefined : { target: 'pino-pretty', options: { singleLine: true } },
          },
        };
      },
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        uri: config.get('MONGODB_URI', { infer: true }),
        serverSelectionTimeoutMS: 10_000,
      }),
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    ...(existsSync(WEB_DIST)
      ? [ServeStaticModule.forRoot({ rootPath: WEB_DIST, exclude: ['/api/{*path}'] })]
      : []),
    UsersModule,
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
