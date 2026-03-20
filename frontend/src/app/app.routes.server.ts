import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
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
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
