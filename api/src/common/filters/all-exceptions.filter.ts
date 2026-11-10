import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

export interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
  requestId?: string;
}

/**
 * Normalises every error into one predictable JSON shape and makes sure that
 * unexpected errors are logged with a stack trace but never leak internals to the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { id?: string }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Something went wrong. Please try again later.';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as string | { message?: string | string[]; error?: string };
      const fallbackError = toTitle(HttpStatus[status] ?? 'Error');
      if (typeof body === 'string') {
        message = body;
        error = fallbackError;
      } else {
        message = body.message ?? exception.message;
        error = body.error ?? fallbackError;
      }
    } else {
      this.logger.error(
        { err: exception, path: req.url },
        exception instanceof Error ? exception.message : 'Unhandled exception',
      );
    }

    const payload: ErrorResponseBody = {
      statusCode: status,
      error,
      message,
      path: req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id,
    };
    res.status(status).json(payload);
  }
}

function toTitle(enumKey: string): string {
  return enumKey
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
