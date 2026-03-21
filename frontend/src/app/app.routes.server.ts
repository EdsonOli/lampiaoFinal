import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Public pages: render on demand (no pre-rendering)
  {
    path: 'login',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'cadastro',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'user/login',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'user/cadastro',
    renderMode: RenderMode.Prerender,
  },
  
  // Protected pages: render on client to respect auth state
  {
    path: 'timeline',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'livros',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'livros/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'books/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'books/by_publishing/:publishing_name',
    renderMode: RenderMode.Client,
  },
  {
    path: 'series',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'series/:seriesId',
    renderMode: RenderMode.Client,
  },
  {
    path: 'perfil',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'user/logout',
    renderMode: RenderMode.Client,
  },
  
  // Catch-all
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
