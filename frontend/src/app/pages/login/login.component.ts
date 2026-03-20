import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { mapGoogleAuthError } from '../../core/utils/map-google-auth-error';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  errorMessage = '';
  loading = false;
  googleLoading = false;

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.form.value;

    this.authService.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/timeline']),
      error: (err) => {
        this.errorMessage = err.error?.message ?? 'Erro ao fazer login.';
        this.loading = false;
      },
    });
  }

  onGoogleLogin(): void {
    this.googleLoading = true;
    this.errorMessage = '';

    this.requestGoogleIdToken()
      .then((idToken) => {
        this.authService.googleAuth(idToken).subscribe({
          next: () => this.router.navigate(['/timeline']),
          error: (err) => {
            this.errorMessage = mapGoogleAuthError(err);
            this.googleLoading = false;
          },
          complete: () => {
            this.googleLoading = false;
          },
        });
      })
      .catch((error) => {
        this.errorMessage = error?.message ?? 'Nao foi possivel iniciar o Google Sign-In.';
        this.googleLoading = false;
      });
  }

  private requestGoogleIdToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!isPlatformBrowser(this.platformId)) {
        reject(new Error('Google Sign-In indisponivel neste ambiente'));
        return;
      }

      const clientId = environment.googleClientId?.trim();
      const googleApi = (window as any).google;

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
