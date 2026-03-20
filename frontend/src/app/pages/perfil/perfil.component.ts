import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of, timeout } from 'rxjs';
import { ApiService, Book, Notebook, UserProfile } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

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

  user: UserProfile | null = null;
  notebooks: Notebook[] = [];
  favoriteBooks: Book[] = [];
  shelfBooks: Book[] = [];
  statusCounts: Record<Notebook['status'], number> = {
    Lido: 0,
    Lendo: 0,
    'Quero ler': 0,
  };
  favoriteCount = 0;
  totalPages = 0;
  loading = true;
  saving = false;
  editMode = false;
  successMessage = '';
  errorMessage = '';

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    nickname: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
  });

  readonly STATUS_LABELS: Record<string, string> = {
    Lido: '✅ Lido',
    Lendo: '📖 Lendo',
    'Quero ler': '🔖 Quero ler',
  };

  ngOnInit(): void {
    forkJoin({
      user: this.apiService.getMe().pipe(
        timeout(10000),
        catchError(() => of<UserProfile | null>(null))
      ),
      notebooks: this.apiService.getMyNotebooks().pipe(
        timeout(10000),
        catchError(() => of<Notebook[]>([]))
      ),
      books: this.apiService.getBooks().pipe(
        timeout(10000),
        catchError(() => of<Book[]>([]))
      ),
    }).subscribe({
      next: ({ user, notebooks, books }) => {
        if (!user) {
          this.errorMessage = 'Sessao expirada ou API indisponivel. Faca login novamente.';
          this.loading = false;
          return;
        }

        this.user = user;
        this.notebooks = notebooks;
        this.form.patchValue({
          name: user.name,
          nickname: user.nickname,
          email: user.email,
        });
        this.buildShelfData(books);
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Sessao expirada ou sem acesso ao perfil. Faca login novamente.';
        this.loading = false;
      },
    });
  }

  toggleEdit(): void {
    this.editMode = !this.editMode;
    this.successMessage = '';
    this.errorMessage = '';
    if (!this.editMode && this.user) {
      this.form.patchValue({
        name: this.user.name,
        nickname: this.user.nickname,
        email: this.user.email,
        password: '',
      });
    }
  }

  saveProfile(): void {
    if (this.form.invalid) return;

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { name, nickname, email, password } = this.form.value;
    const payload: Record<string, string> = {
      name: name!,
      nickname: nickname!,
      email: email!,
    };
    if (password) payload['password'] = password;

    this.apiService.updateMe(payload).subscribe({
      next: (updated) => {
        this.user = updated;
        this.successMessage = 'Perfil atualizado com sucesso!';
        this.saving = false;
        this.editMode = false;
        this.authService.currentUser$;
      },
      error: (err) => {
        this.errorMessage = err.error?.message ?? 'Erro ao salvar perfil.';
        this.saving = false;
      },
    });
  }

  private buildShelfData(books: Book[]): void {
    const booksById = new Map<number, Book>(books.map(book => [book.id, book]));

    this.favoriteBooks = this.notebooks
      .filter(notebook => notebook.favorite)
      .map(notebook => booksById.get(notebook.bookId))
      .filter((book): book is Book => Boolean(book));

    this.shelfBooks = this.notebooks
      .map(notebook => booksById.get(notebook.bookId))
      .filter((book): book is Book => Boolean(book));

    this.statusCounts = {
      Lido: this.notebooks.filter(notebook => notebook.status === 'Lido').length,
      Lendo: this.notebooks.filter(notebook => notebook.status === 'Lendo').length,
      'Quero ler': this.notebooks.filter(notebook => notebook.status === 'Quero ler').length,
    };

    this.favoriteCount = this.notebooks.filter(notebook => notebook.favorite).length;
    this.totalPages = this.notebooks.reduce((sum, notebook) => sum + (booksById.get(notebook.bookId)?.nPages ?? 0), 0);
  }
}
