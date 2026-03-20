import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Post {
  id: number;
  title: string;
  text: string;
  isItPublic: boolean;
  userId: number;
  bookId: number;
  createdAt?: string;
}

export interface CreatePostInput {
  title: string;
  text: string;
  bookId: number;
  isItPublic?: boolean;
}

export interface UpdatePostInput {
  title?: string;
  text?: string;
  isItPublic?: boolean;
}

export interface Book {
  id: number;
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
  id: number;
  userId: number;
  bookId: number;
  grade?: number;
  status: 'Lido' | 'Lendo' | 'Quero ler';
  favorite: boolean;
}

export interface CreateNotebookInput {
  bookId: number;
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
  id: number;
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
  getPostById(id: number): Observable<Post> {
    return this.http.get<Post>(`${this.baseUrl}/posts/${id}`);
  }
  getPostsByUser(userId: number): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}/posts/user/${userId}`);
  }
  getPostsByBook(bookId: number): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}/posts/book/${bookId}`);
  }
  createPost(input: CreatePostInput): Observable<Post> {
    return this.http.post<Post>(`${this.baseUrl}/posts`, input);
  }
  updatePost(id: number, input: UpdatePostInput): Observable<Post> {
    return this.http.put<Post>(`${this.baseUrl}/posts/${id}`, input);
  }
  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/posts/${id}`);
  }

  // Books
  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.baseUrl}/books`);
  }
  getBookById(id: number): Observable<Book> {
    return this.http.get<Book>(`${this.baseUrl}/books/${id}`);
  }
  createBook(input: Omit<Book, 'id'>): Observable<Book> {
    return this.http.post<Book>(`${this.baseUrl}/books`, input);
  }

  // Notebooks
  getMyNotebooks(): Observable<Notebook[]> {
    return this.http.get<Notebook[]>(`${this.baseUrl}/notebooks/me`);
  }
  createNotebook(input: CreateNotebookInput): Observable<Notebook> {
    return this.http.post<Notebook>(`${this.baseUrl}/notebooks`, input);
  }
  updateNotebook(id: number, input: UpdateNotebookInput): Observable<Notebook> {
    return this.http.put<Notebook>(`${this.baseUrl}/notebooks/${id}`, input);
  }
  deleteNotebook(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/notebooks/${id}`);
  }

  // User profile
  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/users/me`);
  }
  getUserById(id: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/users/${id}`);
  }
  updateMe(input: UpdateProfileInput): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/users/me`, input);
  }
  deleteMe(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/me`);
  }
}

