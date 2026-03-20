import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'timeline', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'cadastro',
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'timeline',
    loadComponent: () =>
      import('./pages/timeline/timeline.component').then((m) => m.TimelineComponent),
    canActivate: [authGuard],
  },
  {
    path: 'livros',
    loadComponent: () =>
      import('./pages/book-list/book-list.component').then((m) => m.BookListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'livros/:id',
    loadComponent: () =>
      import('./pages/book-detail/book-detail.component').then((m) => m.BookDetailComponent),
    canActivate: [authGuard],
  },
  {
    path: 'perfil',
    loadComponent: () =>
      import('./pages/perfil/perfil.component').then((m) => m.PerfilComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'login' },
];
