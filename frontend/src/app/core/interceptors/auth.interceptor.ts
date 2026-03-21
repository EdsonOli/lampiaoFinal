import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { appLogger } from '../utils/app-logger';
import { LOG_EVENTS } from '../utils/log-events';

const CREDENTIAL_REQUIRED_PATHS = new Set([
  'auth',
  'admin',
  'comments',
  'notebooks',
  'posts',
  'uploads',
  'users',
]);

function getApiResourcePath(path: string): string {
  if (path.startsWith('/api/v1/')) {
    return path.slice('/api/v1/'.length);
  }

  if (path.startsWith('/api/')) {
    return path.slice('/api/'.length);
  }

  return path.startsWith('/') ? path.slice(1) : path;
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const baseUrl = environment.apiBaseUrl;
  const isOwnApi = req.url.startsWith(baseUrl);

  const path = (() => {
    try {
      return new URL(req.url, 'http://localhost').pathname;
    } catch {
      return req.url;
    }
  })();

  const apiResourcePath = getApiResourcePath(path);
  const rootResource = apiResourcePath.split('/')[0] || '';

  const requiresCredentials = CREDENTIAL_REQUIRED_PATHS.has(rootResource);

  const isBooksWriteOperation = path.includes('/books') && req.method !== 'GET';
  const isSearchBooksWriteOperation = path.includes('/search-books') && req.method !== 'GET';

  if (isOwnApi && (requiresCredentials || isBooksWriteOperation || isSearchBooksWriteOperation)) {
    appLogger.debug(LOG_EVENTS.HTTP_AUTH_CREDENTIALS_ATTACHED, 'Credentials attached to API request', {
      method: req.method,
      url: req.urlWithParams,
      rootResource,
      requiresCredentials,
      isBooksWriteOperation,
      isSearchBooksWriteOperation,
    });

    const authReq = req.clone({
      withCredentials: true,
    });
    return next(authReq);
  }

  return next(req);
};
