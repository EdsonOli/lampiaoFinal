import { Routes } from '@angular/router';
import { authGuard } from '@abp/ng.core';

export const libraryRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/library-list/library-list.component').then(m => m.LibraryListComponent)
  },
  {
    path: 'statistics',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/library-statistics/library-statistics.component').then(m => m.LibraryStatisticsComponent)
  }
];
