import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

export interface ApiResponse<T = any> {
  status: string;
  data: T;
  message: string;
  timestamp: string;
  meta?: Record<string, any>;
}

/**
 * Wraps every JSON response in the standard API envelope:
 * { status, data, message, timestamp, meta? }
 *
 * Skips wrapping for non-JSON responses (e.g. CSV export).
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((body) => {
        const res = context.switchToHttp().getResponse<Response>();

        // Don't wrap non-JSON responses (CSV exports, etc.)
        const contentType = res.getHeader('Content-Type');
        if (
          typeof contentType === 'string' &&
          !contentType.includes('application/json')
        ) {
          return body;
        }

        // If the service already returned { data, ... } with pagination/meta,
        // extract and place into the standard envelope.
        if (body && typeof body === 'object' && 'data' in body) {
          const meta =
            (body as any).meta ??
            (body as any).pagination ??
            undefined;

          return {
            status: 'success',
            data: (body as any).data,
            message: 'OK',
            timestamp: new Date().toISOString(),
            ...(meta ? { meta } : {}),
          };
        }

        return {
          status: 'success',
          data: body ?? null,
          message: 'OK',
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
