import { Routes } from '@angular/router';
import { authGuard } from '@abp/ng.core';

export const socialRoutes: Routes = [
  {
    path: 'timeline',
    loadComponent: () =>
      import('./components/timeline/timeline.component').then(m => m.TimelineComponent)
  },
  {
    path: 'posts/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/post-form/post-form.component').then(m => m.PostFormComponent)
  },
  {
    path: 'posts/:id',
    loadComponent: () =>
      import('./components/post-detail/post-detail.component').then(m => m.PostDetailComponent)
  },
  {
    path: 'posts/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/post-form/post-form.component').then(m => m.PostFormComponent)
  }
];
