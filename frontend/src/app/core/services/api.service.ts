import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Re-export all domain models for backward-compatible imports
export type {
  Post,
  CreatePostInput,
  UpdatePostInput,
  PostDraftPayload,
  Book,
  BookSeriesContext,
  CreateBookFromSearchInput,
  SeriesNarrativePost,
  Notebook,
  CreateNotebookInput,
  UpdateNotebookInput,
  UserProfile,
  UpdateProfileInput,
  SignedUploadResponse,
} from '../models';

import type {
  Post,
  CreatePostInput,
  UpdatePostInput,
  PostDraftPayload,
  Book,
  BookSeriesContext,
  CreateBookFromSearchInput,
  SeriesNarrativePost,
  Notebook,
  CreateNotebookInput,
  UpdateNotebookInput,
  UserProfile,
  UpdateProfileInput,
  SignedUploadResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private get baseUrl(): string {
    return isPlatformBrowser(this.platformId)
      ? environment.apiBaseUrl
      : environment.serverApiBaseUrl;
  }

  // Posts
  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}/posts`);
  }
  getPostById(id: string): Observable<Post> {
    return this.http.get<Post>(`${this.baseUrl}/posts/${id}`);
  }
  getPostsByUser(userId: string): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}/posts/user/${userId}`);
  }
  getPostsByBook(bookId: string): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}/posts/book/${bookId}`);
  }
  createPost(input: CreatePostInput): Observable<Post> {
    return this.http.post<Post>(`${this.baseUrl}/posts`, input);
  }
  updatePost(id: string, input: UpdatePostInput): Observable<Post> {
    return this.http.put<Post>(`${this.baseUrl}/posts/${id}`, input);
  }
  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/posts/${id}`);
  }
  getPostDraft(bookId: string, deviceId: string): Observable<{ draft: PostDraftPayload | null }> {
    return this.http.get<{ draft: PostDraftPayload | null }>(`${this.baseUrl}/posts/drafts/${bookId}`, {
      params: { deviceId },
    });
  }
  savePostDraft(bookId: string, input: { deviceId: string; title?: string; text?: string; isItPublic?: boolean }): Observable<PostDraftPayload> {
    return this.http.put<PostDraftPayload>(`${this.baseUrl}/posts/drafts/${bookId}`, input);
  }
  deletePostDraft(bookId: string, deviceId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/posts/drafts/${bookId}`, {
      params: { deviceId },
    });
  }

  // Books
  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.baseUrl}/books`);
  }
  getBookById(id: string): Observable<Book> {
    return this.http.get<Book>(`${this.baseUrl}/books/${id}`);
  }
  createBook(input: Omit<Book, 'id'>): Observable<Book> {
    return this.http.post<Book>(`${this.baseUrl}/books`, input);
  }
  createBookFromSearch(input: CreateBookFromSearchInput): Observable<Book> {
    return this.http.post<Book>(`${this.baseUrl}/search-books/import`, input);
  }
  updateBook(id: string, input: Partial<Omit<Book, 'id'>>): Observable<Book> {
    return this.http.put<Book>(`${this.baseUrl}/books/${id}`, input);
  }

  // Notebooks
  getMyNotebooks(): Observable<Notebook[]> {
    return this.http.get<Notebook[]>(`${this.baseUrl}/notebooks/me`);
  }
  createNotebook(input: CreateNotebookInput): Observable<Notebook> {
    return this.http.post<Notebook>(`${this.baseUrl}/notebooks`, input);
  }
  updateNotebook(id: string, input: UpdateNotebookInput): Observable<Notebook> {
    return this.http.put<Notebook>(`${this.baseUrl}/notebooks/${id}`, input);
  }
  deleteNotebook(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/notebooks/${id}`);
  }

  // User profile
  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/users/me`);
  }
  getUserById(id: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/users/${id}`);
  }
  updateMe(input: UpdateProfileInput): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/users/me`, input);
  }
  deleteMe(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/me`);
  }

  createProfileImageUploadUrl(fileName: string, mimeType: string): Observable<SignedUploadResponse> {
    return this.http.post<SignedUploadResponse>(`${this.baseUrl}/uploads/profile/sign`, {
      fileName,
      mimeType,
    });
  }

  createBookCoverUploadUrl(fileName: string, mimeType: string, bookId?: string): Observable<SignedUploadResponse> {
    return this.http.post<SignedUploadResponse>(`${this.baseUrl}/uploads/book-cover/sign`, {
      fileName,
      mimeType,
      bookId,
    });
  }

  uploadFileToSignedUrl(uploadUrl: string, file: File): Observable<unknown> {
    return this.http.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });
  }

  // Series
  getSeriesWithBooks(seriesId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/series/${seriesId}`);
  }

  getSeriesForBook(bookId: string): Observable<BookSeriesContext[]> {
    return this.http.get<BookSeriesContext[]>(`${this.baseUrl}/series/by-book/${bookId}`);
  }

  getSeriesNarrativePosts(seriesId: string, limit = 20): Observable<SeriesNarrativePost[]> {
    return this.http.get<SeriesNarrativePost[]>(`${this.baseUrl}/series/${seriesId}/posts`, {
      params: { limit: String(limit) },
    });
  }

  listAllSeries(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/series`);
  }
}

