import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { appLogger } from '../utils/app-logger';
import { LOG_EVENTS } from '../utils/log-events';

export const requestTraceInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const startedAt = Date.now();

  appLogger.debug(LOG_EVENTS.HTTP_REQUEST_STARTED, 'Frontend HTTP request started', {
    method: req.method,
    url: req.urlWithParams,
    withCredentials: req.withCredentials,
  });

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        appLogger.debug(LOG_EVENTS.HTTP_REQUEST_SUCCEEDED, 'Frontend HTTP request succeeded', {
          method: req.method,
          url: req.urlWithParams,
          statusCode: event.status,
          durationMs: Date.now() - startedAt,
          requestId: event.headers.get('x-request-id') ?? undefined,
        });
      }
    }),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        appLogger.debug(LOG_EVENTS.HTTP_REQUEST_FAILED_TRACE, 'Frontend HTTP request failed (trace)', {
          method: req.method,
          url: req.urlWithParams,
          statusCode: error.status,
          durationMs: Date.now() - startedAt,
          requestId: error.headers.get('x-request-id') ?? undefined,
        });
      }

      return throwError(() => error);
    })
  );
};
