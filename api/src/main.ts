import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import type { Env } from './config/env.validation';
import { setupApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService<Env, true>);
  setupApp(app, config.get('CORS_ORIGINS', { infer: true }));

  const swagger = new DocumentBuilder()
    .setTitle('Easygen Auth API')
    .setDescription(
      'Sign up / sign in API. Tokens are issued as httpOnly cookies; Bearer auth is also accepted for API clients.',
    )
    .setVersion('1.0.0')
    .addCookieAuth('access_token')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, () => SwaggerModule.createDocument(app, swagger), {
    customSiteTitle: 'Easygen Auth API',
  });

  const port = config.get('PORT', { infer: true });
  await app.listen(port, '0.0.0.0');
  app.get(Logger).log(`API listening on http://localhost:${port}/api (docs: /api/docs)`);
}

void bootstrap();
