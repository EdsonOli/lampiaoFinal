import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, forkJoin, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OpenLibraryService } from './open-library.service';

export interface GoogleBookCandidate {
  googleId: string;
  name: string;
  writer: string;
  genre: string;
  genres?: string[];
  nPages: number;
  yearPublication: number;
  isbn: string;
  publishingCompany: string;
  img?: string;
  synopsis?: string;
}

@Injectable({ providedIn: 'root' })
export class GoogleBooksService {
  private readonly apiUrl = 'https://www.googleapis.com/books/v1/volumes';
  private http = inject(HttpClient);
  private openLibrary = inject(OpenLibraryService);

  search(query: string, startIndex = 0, maxResults = 20): Observable<GoogleBookCandidate[]> {
    if (!query?.trim()) return of([]);
    
    const key = environment.googleBooksApiKey;
    const keyParam = key ? `&key=${key}` : '';
    const safeMaxResults = Math.min(Math.max(maxResults, 1), 40);
    const safeStartIndex = Math.max(startIndex, 0);
    const url = `${this.apiUrl}?q=${encodeURIComponent(query)}&startIndex=${safeStartIndex}&maxResults=${safeMaxResults}&printType=books&orderBy=relevance${keyParam}`;
    
    const googleResults$ = this.http.get<any>(url).pipe(
      map(response => (response.items || []).map((item: any) => this.mapToCandidate(item))),
      catchError(() => of<GoogleBookCandidate[]>([]))
    );

    const openLibraryResults$ = this.openLibrary.search(query, maxResults).pipe(
      catchError(() => of<GoogleBookCandidate[]>([]))
    );

    // Buscar de ambas as APIs em paralelo
    return forkJoin([googleResults$, openLibraryResults$]).pipe(
      map(([googleBooks, openLibraryBooks]) => this.mergeAndDeduplicate(googleBooks, openLibraryBooks))
    );
  }

  private mergeAndDeduplicate(
    googleBooks: GoogleBookCandidate[],
    openLibraryBooks: GoogleBookCandidate[]
  ): GoogleBookCandidate[] {
    // Mapa de ISBNs normalizado do Google Books
    const googleByNormalizedIsbn = new Map<string, GoogleBookCandidate>();
    for (const book of googleBooks) {
      if (book.isbn) {
        const normalizedIsbn = this.normalizeIsbn(book.isbn);
        googleByNormalizedIsbn.set(normalizedIsbn, book);
      }
    }

    // Set para rastrear qual resultado já foi incluído
    const addedGoogleIds = new Set<string>(googleBooks.map(b => b.googleId));

    // Adicionar livros do Open Library que não estão duplicados
    const uniqueBooks = [...googleBooks];
    for (const olBook of openLibraryBooks) {
      if (!addedGoogleIds.has(olBook.googleId) && olBook.isbn) {
        const normalizedIsbn = this.normalizeIsbn(olBook.isbn);
        
        // Verificar se há duplicata por ISBN
        if (!googleByNormalizedIsbn.has(normalizedIsbn)) {
          uniqueBooks.push(olBook);
          addedGoogleIds.add(olBook.googleId);
        }
      } else if (!olBook.isbn && !addedGoogleIds.has(olBook.googleId)) {
        // Se não tem ISBN, adicionar do mesmo jeito (sem risco de duplicata)
        uniqueBooks.push(olBook);
        addedGoogleIds.add(olBook.googleId);
      }
    }

    return uniqueBooks;
  }

  private normalizeIsbn(isbn: string): string {
    return isbn.replace(/[-\s]/g, '').toLowerCase();
  }

  private mapToCandidate(item: any): GoogleBookCandidate {
    const info = item.volumeInfo || {};
    const isbn13 = (info.industryIdentifiers || []).find((i: any) => i.type === 'ISBN_13');
    const isbn10 = (info.industryIdentifiers || []).find((i: any) => i.type === 'ISBN_10');
    const year = info.publishedDate ? parseInt(info.publishedDate.substring(0, 4), 10) : 0;
    const categories: string[] = (info.categories || [])
      .filter((value: unknown): value is string => typeof value === 'string')
      .map((value: string) => value.trim())
      .filter((value: string) => value.length > 0);
    const uniqueCategories: string[] = [...new Set(categories)];
    const rawImg = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;
    // Force HTTPS for image URLs
    const img = rawImg ? rawImg.replace(/^http:\/\//, 'https://') : undefined;

    return {
      googleId: item.id,
      name: info.title || '',
      writer: (info.authors || []).join(', '),
      genre: uniqueCategories.join(', '),
      genres: uniqueCategories,
      nPages: info.pageCount || 0,
      yearPublication: isNaN(year) ? 0 : year,
      isbn: (isbn13 || isbn10)?.identifier || '',
      publishingCompany: info.publisher || '',
      img,
      synopsis: info.description || '',
    };
  }
}
