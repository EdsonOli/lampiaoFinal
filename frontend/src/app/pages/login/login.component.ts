import { Component, OnInit, OnDestroy, PLATFORM_ID, inject, DestroyRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { mapGoogleAuthError } from '../../core/utils/map-google-auth-error';
import { normalizeApiErrorPayload, ApiErrorPayload } from '../../core/utils/api-error';
import { getUserFacingMessage, FRONTEND_ERROR_CATALOG } from '../../core/utils/error-catalog';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  errorMessage = '';
  errorCode: string | undefined;
  successMessage = '';
  loading = false;
  googleLoading = false;
  retryAfterSeconds: number | undefined;
  private retryCountdown$: Subscription | undefined;

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('registered') === '1') {
      this.successMessage = 'Conta criada com sucesso! Faça login para entrar na comunidade.';
    }
  }

  ngOnDestroy(): void {
    this.retryCountdown$?.unsubscribe();
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.errorCode = undefined;
    this.retryAfterSeconds = undefined;

    const { email, password } = this.form.value;

    this.authService.login(email!, password!).subscribe({
      next: () => {
        void this.router.navigate(['/timeline']);
      },
      error: (err) => {
        this.handleLoginError(err);
        this.loading = false;
      },
    });
  }

  onGoogleLogin(): void {
    this.googleLoading = true;
    this.errorMessage = '';
    this.errorCode = undefined;
    this.retryAfterSeconds = undefined;

    this.requestGoogleIdToken()
      .then((idToken) => {
        this.authService.googleAuth(idToken).subscribe({
          next: () => {
            void this.router.navigate(['/timeline']);
          },
          error: (err) => {
            this.handleGoogleAuthError(err);
            this.googleLoading = false;
          },
          complete: () => {
            this.googleLoading = false;
          },
        });
      })
      .catch((error) => {
        this.errorMessage = error?.message ?? 'Não foi possível iniciar o Google Sign-In.';
        this.googleLoading = false;
      });
  }

  private handleLoginError(error: unknown): void {
    const payload = normalizeApiErrorPayload(error);
    this.errorCode = payload.code;

    // Tratamento especial para rate limiting
    if (payload.code === FRONTEND_ERROR_CATALOG.RATE_LIMIT_LOGIN) {
      this.retryAfterSeconds = payload.retryAfterSeconds;
      this.startRetryCountdown();
    }

    // Use fallback localizado se houver
    this.errorMessage = getUserFacingMessage(payload.code || '', payload.message);
  }

  private handleGoogleAuthError(error: unknown): void {
    const payload = normalizeApiErrorPayload(error);
    this.errorCode = payload.code;

    // Tratamento especial para rate limiting
    if (payload.code === FRONTEND_ERROR_CATALOG.RATE_LIMITED) {
      this.retryAfterSeconds = payload.retryAfterSeconds;
      this.startRetryCountdown();
    }

    // Mensagens contextualizadas para Google auth flow
    this.errorMessage = mapGoogleAuthError(error);
  }

  private startRetryCountdown(): void {
    if (!this.retryAfterSeconds || this.retryAfterSeconds <= 0) return;

    this.retryCountdown$?.unsubscribe();

    let remaining = this.retryAfterSeconds;
    this.retryCountdown$ = interval(1000)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        remaining--;
        if (remaining <= 0) {
          this.retryAfterSeconds = undefined;
          this.retryCountdown$?.unsubscribe();
        } else {
          this.retryAfterSeconds = remaining;
        }
      });
  }

  private requestGoogleIdToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!isPlatformBrowser(this.platformId)) {
        reject(new Error('Google Sign-In indisponivel neste ambiente'));
        return;
      }

      const clientId = environment.googleClientId?.trim();
      const googleApi = (globalThis as any).google;

      if (!clientId || !googleApi?.accounts?.id) {
        reject(new Error('Google Sign-In nao configurado. Defina googleClientId no environment.'));
        return;
      }

      googleApi.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => {
          if (!response?.credential) {
            reject(new Error('Token do Google nao recebido.'));
            return;
          }

          resolve(response.credential);
        },
      });

      googleApi.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
          reject(new Error('Google Sign-In indisponivel no momento.'));
        }
      });
    });
  }
}
