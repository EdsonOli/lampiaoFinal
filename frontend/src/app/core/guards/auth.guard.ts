import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);
  const router = inject(Router);

  // During SSR there is no browser storage. Allow render and let client guard enforce auth.
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  return authService.validateSession().pipe(
    map(user => (user ? true : router.createUrlTree(['/login']))),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
