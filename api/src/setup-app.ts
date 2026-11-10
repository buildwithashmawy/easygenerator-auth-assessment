import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

/**
 * Shared bootstrap used by both main.ts and the e2e tests, so tests exercise the exact
 * same pipeline (prefix, validation, cookies, security headers) as production.
 */
export function setupApp(app: INestApplication, corsOrigins: string[] = []): void {
  const express = app as NestExpressApplication;
  // Railway (and most PaaS) terminate TLS at a proxy; trust one hop so req.ip/req.secure are real.
  express.set('trust proxy', 1);
  express.disable('x-powered-by');

  app.setGlobalPrefix('api');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
        },
      },
    }),
  );
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );
  if (corsOrigins.length) {
    app.enableCors({ origin: corsOrigins, credentials: true });
  }
  app.enableShutdownHooks();
}
