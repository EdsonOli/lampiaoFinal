import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, switchMap, map, catchError, timeout as rxTimeout } from 'rxjs';
import { ApiService, Book } from './api.service';
import { environment } from '../../../environments/environment';
import { appLogger } from '../utils/app-logger';
import { normalizeApiErrorPayload } from '../utils/api-error';
import { LOG_EVENTS } from '../utils/log-events';

export interface ExternalBookSeriesMetadata {
  name: string;
  positionInSeries?: number;
  positionLabel?: string;
  totalBooksKnown?: number;
  universeName?: string;
  metadataSource: string;
  metadataConfidence: 'low' | 'medium' | 'high';
}

export interface ExternalBookResult {
  externalId: string;
  title: string;
  subtitle?: string;
  authors: string[];
  publisher?: string;
  publishedYear?: number;
  description?: string;
  isbns: string[];
  coverUrl?: string;
  categories: string[];
  language?: string;
  source: string;
  series?: ExternalBookSeriesMetadata;
}

export interface BookSearchResult {
  source: 'local' | 'api';
  book: Book; // Sempre normalizado para Book, nunca ExternalBookResult
  alreadyExists: boolean;
  series?: ExternalBookSeriesMetadata;
}

@Injectable({ providedIn: 'root' })
export class IntegratedBookSearchService {
  private readonly apiService = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private get baseUrl(): string {
    return isPlatformBrowser(this.platformId)
      ? environment.apiBaseUrl
      : environment.serverApiBaseUrl;
  }

  /**
   * Search books in cascading order:
   * 1. Local database
   * 2. Backend proxy (Google Books + OpenLibrary) as fallback
   * Returns mixed results with source information
   */
  searchBooks(
    query: string,
    startIndex = 0,
    maxResults = 20
  ): Observable<BookSearchResult[]> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return of([]);

    return this.apiService.getBooks().pipe(
      switchMap((localBooks) => {
        const filteredLocal = this.filterLocalBooks(localBooks, trimmedQuery);

        const localResults: BookSearchResult[] = filteredLocal.map((book) => ({
          source: 'local',
          book,
          alreadyExists: true,
        }));

        return this.searchExternalBooksViaBackend(trimmedQuery, startIndex, maxResults).pipe(
          map((externalResults) => this.mergeResults(localResults, externalResults, maxResults))
        );
      }),
      catchError((error) => {
        const payload = normalizeApiErrorPayload(error);
        appLogger.warn(LOG_EVENTS.BOOK_SEARCH_COMBINED_FAILED, 'Book search failed while combining local and external sources', {
          query: trimmedQuery,
          message: payload.message,
          code: payload.code,
          requestId: payload.requestId,
        });
        return of<BookSearchResult[]>([]);
      })
    );
  }

  /**
   * Search external APIs via backend proxy
   * This avoids CORS issues and rate-limiting problems
   */
  private searchExternalBooksViaBackend(
    query: string,
    startIndex: number,
    maxResults: number
  ): Observable<BookSearchResult[]> {
    return this.http
      .get<ExternalBookResult[]>(`${this.baseUrl}/search-books`, {
        params: {
          q: query,
          startIndex: String(startIndex),
          maxResults: String(maxResults),
        },
      })
      .pipe(
        rxTimeout(15000),
        map((externalBooks) =>
          externalBooks.map((book) => ({
            source: 'api' as const,
            book: this.normalizeExternalBook(book),
            alreadyExists: false,
            series: book.series,
          }))
        ),
        catchError((error) => {
          const payload = normalizeApiErrorPayload(error);
          appLogger.warn(LOG_EVENTS.BOOK_SEARCH_BACKEND_FAILED, 'Backend proxy search failed', {
            query,
            startIndex,
            maxResults,
            message: payload.message,
            code: payload.code,
            requestId: payload.requestId,
          });
          return of<BookSearchResult[]>([]);
        })
      );
  }

  /**
   * Normaliza resultado externo para formato compatible com Book
   */
  private normalizeExternalBook(externalBook: ExternalBookResult): Book {
    const isbn = externalBook.isbns[0] || '';
    const composedTitle = [externalBook.title, externalBook.subtitle]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .join(' - ');

    return {
      id: externalBook.externalId,
      name: composedTitle || externalBook.title,
      writer: externalBook.authors.slice(0, 3).join(', '),
      genre: externalBook.categories.slice(0, 5).join(', '),
      nPages: 0,
      yearPublication: externalBook.publishedYear || 0,
      isbn,
      publishingCompany: externalBook.publisher || '',
      img: externalBook.coverUrl || '',
      synopsis: externalBook.description || '',
    };
  }

  private mergeResults(
    localResults: BookSearchResult[],
    externalResults: BookSearchResult[],
    maxResults: number
  ): BookSearchResult[] {
    const existingKeys = new Set(localResults.map((result) => this.getComparableKey(result.book)));
    const deduplicatedExternal = externalResults.filter((result) => {
      const comparableKey = this.getComparableKey(result.book);
      if (existingKeys.has(comparableKey)) {
        return false;
      }

      existingKeys.add(comparableKey);
      return true;
    });

    return [...localResults, ...deduplicatedExternal].slice(0, maxResults);
  }

  private getComparableKey(book: Book): string {
    const normalizedIsbn = String(book.isbn || '')
      .toUpperCase()
      .split('')
      .filter((character) => /[0-9X]/.test(character))
      .join('');
    if (normalizedIsbn.length >= 10) {
      return `isbn:${normalizedIsbn}`;
    }

    return `text:${book.name.trim().toLowerCase()}::${book.writer.trim().toLowerCase()}`;
  }

  /**
   * Search for more results from external APIs (for infinite scroll)
   */
  searchApisDirectly(
    query: string,
    startIndex = 0,
    maxResults = 20
  ): Observable<BookSearchResult[]> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return of([]);

    return this.searchExternalBooksViaBackend(trimmedQuery, startIndex, maxResults);
  }

  /**
   * Filter local books by query (title, author, genre)
   */
  private filterLocalBooks(books: Book[], query: string): Book[] {
    const q = query.toLowerCase();
    return books.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.writer.toLowerCase().includes(q) ||
        b.genre.toLowerCase().includes(q)
    );
  }
}
