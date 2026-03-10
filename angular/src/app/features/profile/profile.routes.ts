import { Routes } from '@angular/router';
import { authGuard } from '@abp/ng.core';

export const profileRoutes: Routes = [
  {
    path: 'me',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/profile-view/profile-view.component').then(m => m.ProfileViewComponent)
  },
  {
    path: 'me/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/profile-edit/profile-edit.component').then(m => m.ProfileEditComponent)
  },
  {
    path: ':userId',
    loadComponent: () =>
      import('./components/profile-view/profile-view.component').then(m => m.ProfileViewComponent)
  }
];
