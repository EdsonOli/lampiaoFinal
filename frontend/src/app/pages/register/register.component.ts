import { Component, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { mapGoogleAuthError } from '../../core/utils/map-google-auth-error';
import { environment } from '../../../environments/environment';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,128}$/;

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      nickname: ['', [Validators.required, Validators.minLength(2)]],
      password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator }
  );

  errorMessage = '';
  loading = false;
  googleLoading = false;

  get passwordValue(): string {
    return this.form.get('password')?.value ?? '';
  }

  get passwordChecks(): { label: string; valid: boolean }[] {
    const value = this.passwordValue;
    return [
      { label: 'Pelo menos 10 caracteres', valid: value.length >= 10 },
      { label: 'Uma letra maiuscula', valid: /[A-Z]/.test(value) },
      { label: 'Uma letra minuscula', valid: /[a-z]/.test(value) },
      { label: 'Um numero', valid: /\d/.test(value) },
      { label: 'Um simbolo', valid: /[^A-Za-z0-9]/.test(value) },
    ];
  }

  get passwordStrengthLabel(): 'Fraca' | 'Media' | 'Forte' {
    const score = this.passwordChecks.filter((item) => item.valid).length;
    if (score <= 2) return 'Fraca';
    if (score <= 4) return 'Media';
    return 'Forte';
  }

  get passwordStrengthClass(): 'weak' | 'medium' | 'strong' {
    const label = this.passwordStrengthLabel;
    if (label === 'Fraca') return 'weak';
    if (label === 'Media') return 'medium';
    return 'strong';
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const { name, email, nickname, password, confirmPassword } = this.form.value;

    this.authService.register(name!, email!, nickname!, password!, confirmPassword!).subscribe({
      next: () => { void this.router.navigate(['/login'], { queryParams: { registered: '1' } }); },
      error: (err) => {
        this.errorMessage = err.error?.message ?? 'Erro ao criar conta.';
        this.loading = false;
      },
    });
  }

  onGoogleRegister(): void {
    this.googleLoading = true;
    this.errorMessage = '';

    this.requestGoogleIdToken()
      .then((idToken) => {
        this.authService.googleAuth(idToken).subscribe({
          next: () => { void this.router.navigate(['/timeline']); },
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
