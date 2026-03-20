import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, finalize, of, timeout } from 'rxjs';
import { ApiService, Book, Notebook, UserProfile } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
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
  editMode = false;
  successMessage = '';
  errorMessage = '';
  formError = '';

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
    const booksById = new Map<number, Book>(this.books.map(book => [book.id, book]));

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
