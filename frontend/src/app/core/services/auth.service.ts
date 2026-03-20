import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  nickname: string;
  img?: string;
}

interface LoginResponse {
  user: AuthUser;
}

interface RegisterResponse extends AuthUser {}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly USER_KEY = 'lampiao_user';

  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.loadUser());
  currentUser$ = this.currentUserSubject.asObservable();

  private get apiBaseUrl(): string {
    return isPlatformBrowser(this.platformId)
      ? environment.apiBaseUrl
      : environment.serverApiBaseUrl;
  }

  private get apiUrl(): string {
    return `${this.apiBaseUrl}/auth`;
  }

  private get userApiUrl(): string {
    return `${this.apiBaseUrl}/users`;
  }

  get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }, { withCredentials: true }).pipe(
      tap(response => this.saveSession(response.user))
    );
  }

  register(name: string, email: string, nickname: string, password: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, { name, email, nickname, password }, { withCredentials: true });
  }

  validateSession(): Observable<AuthUser | null> {
    return this.http.get<AuthUser>(`${this.userApiUrl}/me`, { withCredentials: true }).pipe(
      tap(user => this.saveSession(user)),
      map(user => user ?? null),
      catchError(() => this.http.post<void>(`${this.apiUrl}/refresh`, {}, { withCredentials: true }).pipe(
        switchMap(() => this.http.get<AuthUser>(`${this.userApiUrl}/me`, { withCredentials: true })),
        tap(user => this.saveSession(user)),
        map(user => user ?? null),
        catchError(() => {
          this.clearSession();
          return of(null);
        })
      ))
    );
  }

  updateCurrentUser(user: AuthUser): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  clearSession(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.USER_KEY);
    }
    this.currentUserSubject.next(null);
  }

  logout(): Observable<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(void 0);
    }

    return this.http.post<void>(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      catchError(() => of(void 0)),
      tap(() => {
        this.clearSession();
      })
    );
  }

  private saveSession(user: AuthUser | null): void {
    if (isPlatformBrowser(this.platformId)) {
      if (user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(this.USER_KEY);
      }
    }
    this.currentUserSubject.next(user);
  }

  private loadUser(): AuthUser | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  }
}
