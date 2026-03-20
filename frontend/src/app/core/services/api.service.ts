import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Post {
  id: string;
  title: string;
  text: string;
  isItPublic: boolean;
  userId: string;
  bookId: string;
  createdAt?: string;
}

export interface CreatePostInput {
  title: string;
  text: string;
  bookId: string;
  isItPublic?: boolean;
}

export interface UpdatePostInput {
  title?: string;
  text?: string;
  isItPublic?: boolean;
}

export interface Book {
  id: string;
  name: string;
  writer: string;
  genre: string;
  nPages: number;
  yearPublication: number;
  isbn: string;
  publishingCompany: string;
  img?: string;
  synopsis?: string;
}

export interface Notebook {
  id: string;
  userId: string;
  bookId: string;
  grade?: number;
  status: 'Lido' | 'Lendo' | 'Quero ler';
  favorite: boolean;
}

export interface CreateNotebookInput {
  bookId: string;
  grade?: number;
  status: Notebook['status'];
  favorite?: boolean;
}

export interface UpdateNotebookInput {
  grade?: number;
  status?: Notebook['status'];
  favorite?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  nickname: string;
  img?: string;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  nickname?: string;
  password?: string;
  img?: string;
}

export interface SignedUploadResponse {
  uploadUrl: string;
  publicUrl: string;
  path: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

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
}

