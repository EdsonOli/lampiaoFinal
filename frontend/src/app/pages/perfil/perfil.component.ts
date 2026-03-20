import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { catchError, finalize, of, switchMap, timeout } from 'rxjs';
import { ApiService, Book, Notebook, UserProfile } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { mapGoogleAuthError } from '../../core/utils/map-google-auth-error';
import { environment } from '../../../environments/environment';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

interface ShelfItem {
  book: Book;
  notebook: Notebook;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css',
})
export class PerfilComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  user: UserProfile | null = null;
  notebooks: Notebook[] = [];
  books: Book[] = [];
  favoriteShelfItems: ShelfItem[] = [];
  shelfItems: ShelfItem[] = [];
  statusCounts: Record<Notebook['status'], number> = {
    Lido: 0,
    Lendo: 0,
    'Quero ler': 0,
  };
  favoriteCount = 0;
  totalPages = 0;
  loading = true;
  saving = false;
  deletingAccount = false;
  linkingGoogle = false;
  uploadingImage = false;
  editMode = false;
  successMessage = '';
  errorMessage = '';
  formError = '';
  selectedImageName = '';

  private userLoaded = false;
  private notebooksLoaded = false;
  private booksLoaded = false;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    nickname: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    img: [''],
    password: [''],
    passwordConfirm: [''],
  });

  readonly STATUS_LABELS: Record<string, string> = {
    Lido: '✅ Lido',
    Lendo: '📖 Lendo',
    'Quero ler': '🔖 Quero ler',
  };

  ngOnInit(): void {
    this.loadUser();
    this.loadNotebooks();
    this.loadBooks();
  }

  toggleEdit(): void {
    this.editMode = !this.editMode;
    this.successMessage = '';
    this.formError = '';
    if (!this.editMode && this.user) {
      this.form.patchValue({
        name: this.user.name,
        nickname: this.user.nickname,
        email: this.user.email,
        img: this.user.img ?? '',
        password: '',
        passwordConfirm: '',
      });
    }
  }

  saveProfile(): void {
    if (this.form.invalid) return;

    this.saving = true;
    this.formError = '';
    this.successMessage = '';

    const { name, nickname, email, img, password, passwordConfirm } = this.form.value;

    if (password && password !== passwordConfirm) {
      this.formError = 'As senhas não coincidem.';
      this.saving = false;
      return;
    }

    const payload: Record<string, string> = {
      name: name!,
      nickname: nickname!,
      email: email!,
    };
    if (password) payload['password'] = password;
    if (img) payload['img'] = img;

    this.apiService.updateMe(payload).pipe(
      timeout(10000),
      catchError((err) => {
        this.formError = err.error?.message ?? 'Erro ao salvar perfil. Servidor pode estar indisponível.';
        this.saving = false;
        return of(null);
      }),
      finalize(() => {
        this.zone.run(() => {
          if (this.saving) {
            this.saving = false;
            this.cdr.detectChanges();
          }
        });
      })
    ).subscribe({
      next: (updated) => {
        this.zone.run(() => {
          if (updated) {
            this.user = updated;
            this.successMessage = 'Perfil atualizado com sucesso!';
            this.editMode = false;
            this.authService.updateCurrentUser({
              id: updated.id,
              name: updated.name,
              email: updated.email,
              nickname: updated.nickname,
              img: updated.img,
            });
            this.form.patchValue({
              password: '',
              passwordConfirm: '',
            });
          }
          this.cdr.detectChanges();
        });
      },
    });
  }

  deleteAccount(): void {
    if (this.deletingAccount) return;

    this.deletingAccount = true;
    this.formError = '';
    this.successMessage = '';

    this.apiService.deleteMe().pipe(
      timeout(10000),
      catchError((err) => {
        this.formError = err.error?.message ?? 'Não foi possível excluir a conta. Servidor pode estar indisponível.';
        this.deletingAccount = false;
        return of(null);
      }),
      finalize(() => {
        this.zone.run(() => {
          if (this.deletingAccount) {
            this.deletingAccount = false;
            this.cdr.detectChanges();
          }
        });
      })
    ).subscribe({
      next: () => {
        this.zone.run(() => {
          this.authService.clearSession();
          this.router.navigate(['/login']);
          this.cdr.detectChanges();
        });
      },
    });
  }

  onProfileImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

    if (!allowedTypes.has(file.type)) {
      this.formError = 'Formato nao suportado. Use JPG, PNG, WEBP ou AVIF.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.formError = 'A imagem deve ter no maximo 5MB.';
      input.value = '';
      return;
    }

    this.uploadingImage = true;
    this.formError = '';
    this.successMessage = '';
    this.selectedImageName = file.name;

    this.apiService
      .createProfileImageUploadUrl(file.name, file.type)
      .pipe(
        switchMap((signed) =>
          this.apiService
            .uploadFileToSignedUrl(signed.uploadUrl, file)
            .pipe(switchMap(() => this.apiService.updateMe({ img: signed.publicUrl })))
        ),
        timeout(15000),
        catchError((err) => {
          this.formError = err.error?.message ?? 'Nao foi possivel enviar a imagem agora.';
          this.uploadingImage = false;
          return of(null);
        }),
        finalize(() => {
          this.zone.run(() => {
            if (this.uploadingImage) {
              this.uploadingImage = false;
              this.cdr.detectChanges();
            }
          });
        })
      )
      .subscribe((updatedUser) => {
        this.zone.run(() => {
          if (!updatedUser) {
            return;
          }

          this.user = updatedUser;
          this.successMessage = 'Foto de perfil atualizada com sucesso!';
          this.authService.updateCurrentUser({
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            nickname: updatedUser.nickname,
            img: updatedUser.img,
          });
          this.form.patchValue({ img: updatedUser.img ?? '' });
          this.cdr.detectChanges();
        });
      });
  }

  linkGoogleAccount(): void {
    if (this.linkingGoogle) {
      return;
    }

    this.linkingGoogle = true;
    this.formError = '';
    this.successMessage = '';

    this.requestGoogleIdToken()
      .then((idToken) => {
        this.authService.linkGoogleAccount(idToken)
          .pipe(
            timeout(10000),
            catchError((err) => {
              this.formError = mapGoogleAuthError(err);
              this.linkingGoogle = false;
              return of(null);
            }),
            finalize(() => {
              this.zone.run(() => {
                if (this.linkingGoogle) {
                  this.linkingGoogle = false;
                  this.cdr.detectChanges();
                }
              });
            })
          )
          .subscribe((response) => {
            this.zone.run(() => {
              if (!response?.user) {
                return;
              }

              this.successMessage = 'Conta Google vinculada com sucesso!';

              this.authService.updateCurrentUser({
                id: response.user.id,
                name: response.user.name,
                email: response.user.email,
                nickname: response.user.nickname,
                img: response.user.img,
              });

              if (this.user) {
                this.user = {
                  ...this.user,
                  img: this.user.img ?? response.user.img,
                };
              }

              this.cdr.detectChanges();
            });
          });
      })
      .catch((error) => {
        this.formError = error?.message ?? 'Nao foi possivel iniciar o Google Sign-In.';
        this.linkingGoogle = false;
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

  private loadUser(): void {
    this.apiService
      .getMe()
      .pipe(
        timeout(10000),
        catchError(() => of<UserProfile | null>(null)),
        finalize(() => {
          this.zone.run(() => {
            this.userLoaded = true;
            this.refreshLoading();
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: user => {
          this.zone.run(() => {
            if (!user) {
              const cachedUser = this.authService.currentUser;
              if (cachedUser) {
                this.user = {
                  id: cachedUser.id,
                  name: cachedUser.name,
                  email: cachedUser.email,
                  nickname: cachedUser.nickname,
                  img: cachedUser.img,
                };
                this.form.patchValue({
                  name: cachedUser.name,
                  nickname: cachedUser.nickname,
                  email: cachedUser.email,
                  img: cachedUser.img ?? '',
                });
                this.errorMessage = 'Perfil carregado em modo local. Algumas informacoes podem estar desatualizadas.';
                return;
              }

              this.errorMessage = 'Sessao expirada ou API indisponivel. Faca login novamente.';
              return;
            }

            this.user = user;
            this.form.patchValue({
              name: user.name,
              nickname: user.nickname,
              email: user.email,
              img: user.img ?? '',
            });
          });
        },
      });
  }

  private loadNotebooks(): void {
    this.apiService
      .getMyNotebooks()
      .pipe(
        timeout(10000),
        catchError(() => of<Notebook[]>([])),
        finalize(() => {
          this.zone.run(() => {
            this.notebooksLoaded = true;
            this.refreshLoading();
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe(notebooks => {
        this.zone.run(() => {
          this.notebooks = notebooks;
          this.buildShelfData();
          this.cdr.detectChanges();
        });
      });
  }

  private loadBooks(): void {
    this.apiService
      .getBooks()
      .pipe(
        timeout(10000),
        catchError(() => of<Book[]>([])),
        finalize(() => {
          this.zone.run(() => {
            this.booksLoaded = true;
            this.refreshLoading();
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe(books => {
        this.zone.run(() => {
          this.books = books;
          this.buildShelfData();
          this.cdr.detectChanges();
        });
      });
  }

  private buildShelfData(): void {
    const booksById = new Map<string, Book>(this.books.map(book => [book.id, book]));

    const mergedItems: ShelfItem[] = this.notebooks
      .map(notebook => {
        const book = booksById.get(notebook.bookId);
        if (!book) return null;
        return { book, notebook };
      })
      .filter((item): item is ShelfItem => Boolean(item));

    this.shelfItems = mergedItems;
    this.favoriteShelfItems = mergedItems.filter(item => item.notebook.favorite);

    this.statusCounts = {
      Lido: this.notebooks.filter(notebook => notebook.status === 'Lido').length,
      Lendo: this.notebooks.filter(notebook => notebook.status === 'Lendo').length,
      'Quero ler': this.notebooks.filter(notebook => notebook.status === 'Quero ler').length,
    };

    this.favoriteCount = this.notebooks.filter(notebook => notebook.favorite).length;
    // Legacy parity: paginometro counts pages from books marked as "Lido".
    this.totalPages = this.notebooks
      .filter(notebook => notebook.status === 'Lido')
      .reduce((sum, notebook) => sum + (booksById.get(notebook.bookId)?.nPages ?? 0), 0);
  }

  private refreshLoading(): void {
    this.loading = !(this.userLoaded && this.notebooksLoaded && this.booksLoaded);
  }
}
