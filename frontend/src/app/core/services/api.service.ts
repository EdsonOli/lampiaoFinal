import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Post {
  id: number;
  title: string;
  text: string;
  isItPublic: boolean;
  userId: number;
  bookId: number;
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
  private readonly baseUrl = 'http://localhost:3000/api';
  private http = inject(HttpClient);

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

  // Books
  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.baseUrl}/books`);
  }
  getBookById(id: number): Observable<Book> {
    return this.http.get<Book>(`${this.baseUrl}/books/${id}`);
  }

  // Notebooks
  getMyNotebooks(): Observable<Notebook[]> {
    return this.http.get<Notebook[]>(`${this.baseUrl}/notebooks/me`);
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
}

