import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const baseUrl = environment.apiBaseUrl;
  const isOwnApi = baseUrl.startsWith('/')
    ? req.url.startsWith(baseUrl)
    : req.url.startsWith(baseUrl);

  if (isOwnApi) {
    const authReq = req.clone({
      withCredentials: true,
    });
    return next(authReq);
  }

  return next(req);
};
