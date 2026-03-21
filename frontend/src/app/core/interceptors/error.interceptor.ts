import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { normalizeApiErrorPayload } from '../utils/api-error';
import { appLogger } from '../utils/app-logger';
import { LOG_EVENTS } from '../utils/log-events';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => next(req).pipe(
  catchError((error: unknown) => {
    if (error instanceof HttpErrorResponse) {
      const payload = normalizeApiErrorPayload(error);

      appLogger[error.status >= 500 ? 'error' : 'warn'](
        LOG_EVENTS.HTTP_REQUEST_FAILED,
        'Frontend HTTP request failed',
        {
          method: req.method,
          url: req.urlWithParams,
          statusCode: error.status,
          code: payload.code,
          requestId: payload.requestId,
          path: payload.path,
          message: payload.message,
          details: payload.details,
        }
      );

      return throwError(() => new HttpErrorResponse({
        error: payload,
        headers: error.headers,
        status: error.status,
        statusText: error.statusText,
        url: error.url ?? undefined,
      }));
    }

    appLogger.error(LOG_EVENTS.HTTP_REQUEST_FAILED, 'Frontend request failed with a non-HTTP error', {
      method: req.method,
      url: req.urlWithParams,
      error,
    });

    return throwError(() => error);
  })
);