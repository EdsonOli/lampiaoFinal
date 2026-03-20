import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { GoogleBookCandidate } from './google-books.service';

interface OpenLibrarySearchResponse {
  docs?: OpenLibraryBook[];
  numFound?: number;
}

interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  publisher?: string[];
  first_publish_year?: number;
  isbn?: string[];
  subject?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
}

@Injectable({ providedIn: 'root' })
export class OpenLibraryService {
  private readonly apiUrl = 'https://openlibrary.org/search.json';
  private http = inject(HttpClient);

  search(query: string, limit = 20): Observable<GoogleBookCandidate[]> {
    if (!query?.trim()) return of([]);
    const url = `${this.apiUrl}?title=${encodeURIComponent(query)}&limit=${Math.min(limit, 100)}&has_fulltext=true`;
    
    return this.http.get<OpenLibrarySearchResponse>(url).pipe(
      map(response => (response.docs || []).map((item: OpenLibraryBook) => this.mapToCandidate(item)))
    );
  }

  private mapToCandidate(item: OpenLibraryBook): GoogleBookCandidate {
    // Construir genres a partir dos subjects
    const subjects: string[] = (item.subject || [])
      .filter((s: unknown) => typeof s === 'string')
      .map((s: string) => this.capitalizeGenre(s))
      .slice(0, 5); // Limitar a 5 gêneros

    const uniqueGenres = [...new Set(subjects)];
    const genreString = uniqueGenres.join(', ');

    // Construir URL da capa
    const img = item.cover_i 
      ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`
      : undefined;

    // Normalizar ISBN
    const isbn = (item.isbn && item.isbn[0]) || '';

    return {
      // Open Library book key como ID
      googleId: item.key.replace('/works/', '').replace('/books/', ''),
      name: item.title || '',
      writer: (item.author_name || []).slice(0, 3).join(', '),
      genre: genreString,
      genres: uniqueGenres,
      nPages: item.number_of_pages_median || 0,
      yearPublication: item.first_publish_year || 0,
      isbn,
      publishingCompany: (item.publisher && item.publisher[0]) || '',
      img,
      synopsis: '',
    };
  }

  private capitalizeGenre(genre: string): string {
    return genre
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
