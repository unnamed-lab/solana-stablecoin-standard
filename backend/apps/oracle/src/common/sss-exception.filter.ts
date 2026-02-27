import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { SSSBaseError, parseProgramError } from '@stbr/sss-token';

/**
 * Map SSS SDK error codes to HTTP status codes.
 *
 * - 6000–6005  Access control → 403 Forbidden
 * - 6006–6008  Feature gating  → 400 Bad Request
 * - 6009–6014  State guards    → 409 Conflict
 * - 6015–6017  Quota           → 422 Unprocessable Entity
 * - 6018–6019  Authority       → 403 Forbidden
 * - 6020–6023  Validation      → 400 Bad Request
 * - 6100–6104  Transfer hook   → 403 Forbidden
 */
function sssCodeToHttpStatus(code?: number): number {
  if (code === undefined) return HttpStatus.INTERNAL_SERVER_ERROR;
  if (code >= 6000 && code <= 6005) return HttpStatus.FORBIDDEN;
  if (code >= 6006 && code <= 6008) return HttpStatus.BAD_REQUEST;
  if (code >= 6009 && code <= 6014) return HttpStatus.CONFLICT;
  if (code >= 6015 && code <= 6017) return HttpStatus.UNPROCESSABLE_ENTITY;
  if (code >= 6018 && code <= 6019) return HttpStatus.FORBIDDEN;
  if (code >= 6020 && code <= 6023) return HttpStatus.BAD_REQUEST;
  if (code >= 6100 && code <= 6104) return HttpStatus.FORBIDDEN;
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

/**
 * Global exception filter that converts SDK errors and unknown errors
 * into the standard API response format with proper HTTP status codes.
 */
@Catch()
export class SssExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SssExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    // ── 1. NestJS HttpException (validation errors, 404, etc.) ──────
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // class-validator errors come as { message: string[] }
      const message =
        typeof exceptionResponse === 'object' &&
        'message' in (exceptionResponse as any)
          ? Array.isArray((exceptionResponse as any).message)
            ? (exceptionResponse as any).message.join('; ')
            : (exceptionResponse as any).message
          : exception.message;

      res.status(status).json({
        status: 'error',
        data: null,
        message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // ── 2. Try to parse as an SSS SDK / Anchor error ────────────────
    const parsed = parseProgramError(exception);

    if (parsed instanceof SSSBaseError) {
      const httpStatus = sssCodeToHttpStatus(parsed.code);
      this.logger.warn(
        `SSS Error [${parsed.code}] ${parsed.name}: ${parsed.message}`,
      );

      res.status(httpStatus).json({
        status: 'error',
        data: null,
        message: parsed.message,
        timestamp: new Date().toISOString(),
        meta: {
          errorCode: parsed.code,
          errorName: parsed.name,
        },
      });
      return;
    }

    // ── 3. SendTransactionError (not parseable to a known SDK error) ─
    if (
      exception &&
      typeof exception === 'object' &&
      'transactionMessage' in (exception as any)
    ) {
      const txErr = exception as any;
      this.logger.error(
        `Transaction failed: ${txErr.transactionMessage}`,
        txErr.transactionLogs,
      );

      res.status(HttpStatus.BAD_GATEWAY).json({
        status: 'error',
        data: null,
        message: txErr.transactionMessage || 'Transaction simulation failed',
        timestamp: new Date().toISOString(),
        meta: {
          logs: txErr.transactionLogs,
        },
      });
      return;
    }

    // ── 4. Unrecognised / unexpected errors ─────────────────────────
    const message =
      exception instanceof Error ? exception.message : String(exception);
    this.logger.error(`Unhandled error: ${message}`, (exception as any)?.stack);

    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      data: null,
      message:
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : message,
      timestamp: new Date().toISOString(),
    });
  }
}
