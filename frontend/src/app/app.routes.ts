import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'timeline', pathMatch: 'full' },
  // Legacy URL aliases from old EJS app (main branch)
  { path: 'user', redirectTo: 'perfil', pathMatch: 'full' },
  { path: 'user/login', redirectTo: 'login', pathMatch: 'full' },
  { path: 'user/cadastro', redirectTo: 'cadastro', pathMatch: 'full' },
  { path: 'user/perfil', redirectTo: 'perfil', pathMatch: 'full' },
  {
    path: 'user/logout',
    loadComponent: () =>
      import('./pages/logout/logout.component').then((m) => m.LogoutComponent),
  },
  { path: 'books', redirectTo: 'livros', pathMatch: 'full' },
  { path: 'books/by_name', redirectTo: 'livros', pathMatch: 'full' },
  { path: 'books/by_writer', redirectTo: 'livros', pathMatch: 'full' },
  { path: 'books/by_publishing/:publishing_name', redirectTo: 'livros', pathMatch: 'full' },
  { path: 'books/:id', redirectTo: 'livros/:id', pathMatch: 'full' },
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
