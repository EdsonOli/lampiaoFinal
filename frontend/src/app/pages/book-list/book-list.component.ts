import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, map, of, timeout } from 'rxjs';
import { ApiService, Book } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { GoogleBooksService, GoogleBookCandidate } from '../../core/services/google-books.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './book-list.component.html',
  styleUrl: './book-list.component.css',
})
export class BookListComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private googleBooks = inject(GoogleBooksService);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  // --- Lista principal ---
  books: Book[] = [];
  loading = true;
  error = '';

  // --- Filtro local ---
  filterQuery = '';
  get filteredBooks(): Book[] {
    const q = this.filterQuery.trim().toLowerCase();
    if (!q) return this.books;
    return this.books.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.writer.toLowerCase().includes(q) ||
      b.genre.toLowerCase().includes(q)
    );
  }

  get isAdmin(): boolean {
    return this.authService.currentUser?.role === 'admin';
  }

  // --- Modal de criação ---
  showModal = false;
  modalStep: 'search' | 'form' = 'search';
  formMode: 'create' | 'edit' = 'create';
  editingBookId: string | null = null;

  googleQuery = '';
  googleResults: GoogleBookCandidate[] = [];
  selectedGoogleIds = new Set<string>();
  showOnlyCompleteCandidates = true;
  googleLoading = false;
  googleLoadingMore = false;
  googleHasMore = true;
  private readonly googlePageSize = 20;
  private googleStartIndex = 0;
  bulkSaving = false;
  googleError = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  get existingIsbnSet(): Set<string> {
    return new Set(
      this.books
        .map(book => this.normalizeIsbn(book.isbn))
        .filter(isbn => Boolean(isbn))
    );
  }

  get visibleGoogleResults(): GoogleBookCandidate[] {
    if (!this.showOnlyCompleteCandidates) return this.googleResults;
    return this.googleResults.filter(candidate => this.isCandidateBulkValid(candidate));
  }

  get hiddenIncompleteCount(): number {
    return this.googleResults.length - this.visibleGoogleResults.length;
  }

  form: Omit<Book, 'id'> = {
    name: '', writer: '', genre: '', nPages: 0,
    yearPublication: new Date().getFullYear(),
    isbn: '', publishingCompany: '', img: '', synopsis: '',
  };
  saving = false;
  saveError = '';
  coverUploadBusy = false;
  coverUploadError = '';
  selectedCoverName = '';
  coverPreviewUrl = '';

  ngOnInit(): void {
    this.loadBooks();
  }

  private loadBooks(): void {
    this.apiService.getBooks().pipe(
      timeout(10000),
      catchError(() => {
        this.zone.run(() => {
          this.error = 'Não foi possível carregar os livros. Servidor pode estar indisponível.';
        });
        return of<Book[]>([]);
      }),
      finalize(() => {
        this.zone.run(() => {
          this.loading = false;
          this.cdr.detectChanges();
        });
      })
    ).subscribe({
      next: books => {
        this.zone.run(() => { this.books = books; this.cdr.detectChanges(); });
      },
    });
  }

  // --- Ações do modal ---
  openModal(): void {
    this.showModal = true;
    this.modalStep = 'search';
    this.formMode = 'create';
    this.editingBookId = null;
    this.googleQuery = '';
    this.googleResults = [];
    this.googleHasMore = true;
    this.googleStartIndex = 0;
    this.googleLoading = false;
    this.googleLoadingMore = false;
    this.showOnlyCompleteCandidates = true;
    this.googleError = '';
    this.resetForm();
    this.saveError = '';
  }

  closeModal(): void {
    this.showModal = false;
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  onGoogleInput(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);

    const query = this.googleQuery.trim();
    if (query.length < 3) {
      this.googleResults = [];
      this.selectedGoogleIds.clear();
      this.googleHasMore = true;
      this.googleStartIndex = 0;
      this.googleLoading = false;
      this.googleLoadingMore = false;
      return;
    }

    this.googleLoading = true;
    this.googleLoadingMore = false;
    this.googleHasMore = true;
    this.googleStartIndex = 0;
    this.googleError = '';
    this.cdr.detectChanges();

    this.searchTimer = setTimeout(() => {
      this.fetchGooglePage(true);
    }, 400);
  }

  onResultsScroll(event: Event): void {
    if (this.googleLoading || this.googleLoadingMore || !this.googleHasMore) return;

    const target = event.target as HTMLElement;
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 48;

    if (nearBottom) {
      this.fetchGooglePage(false);
    }
  }

  selectCandidate(candidate: GoogleBookCandidate): void {
    this.formMode = 'create';
    this.editingBookId = null;
    this.form = {
      name: candidate.name,
      writer: candidate.writer,
      genre: candidate.genre,
      nPages: candidate.nPages,
      yearPublication: candidate.yearPublication,
      isbn: candidate.isbn,
      publishingCompany: candidate.publishingCompany,
      img: candidate.img ?? '',
      synopsis: candidate.synopsis ?? '',
    };
    this.coverPreviewUrl = this.form.img || '';
    this.modalStep = 'form';
  }

  toggleCandidate(candidate: GoogleBookCandidate): void {
    if (this.isAlreadyRegistered(candidate)) return;

    if (this.selectedGoogleIds.has(candidate.googleId)) {
      this.selectedGoogleIds.delete(candidate.googleId);
    } else {
      this.selectedGoogleIds.add(candidate.googleId);
    }
  }

  isCandidateSelected(candidate: GoogleBookCandidate): boolean {
    return this.selectedGoogleIds.has(candidate.googleId);
  }

  selectAllCandidates(): void {
    this.visibleGoogleResults.forEach(result => {
      if (!this.isAlreadyRegistered(result)) {
        this.selectedGoogleIds.add(result.googleId);
      }
    });
  }

  clearSelectedCandidates(): void {
    this.selectedGoogleIds.clear();
  }

  submitSelectedBooks(): void {
    if (this.bulkSaving) return;

    const selectedCandidates = this.googleResults.filter(result => this.selectedGoogleIds.has(result.googleId));
    if (selectedCandidates.length === 0) {
      this.googleError = 'Selecione pelo menos um livro para cadastrar em lote.';
      return;
    }

    const validCandidates: GoogleBookCandidate[] = [];
    const invalidCandidates: GoogleBookCandidate[] = [];

    selectedCandidates.forEach(candidate => {
      if (this.isAlreadyRegistered(candidate)) {
        invalidCandidates.push(candidate);
        return;
      }

      if (this.isCandidateBulkValid(candidate)) {
        validCandidates.push(candidate);
      } else {
        invalidCandidates.push(candidate);
      }
    });

    if (validCandidates.length === 0) {
      this.googleError = 'Os livros selecionados nao possuem os campos obrigatórios (titulo, autor, ISBN e editora).';
      return;
    }

    this.bulkSaving = true;
    this.googleError = '';

    const createRequests = validCandidates.map(candidate => {
      const payload: Omit<Book, 'id'> = {
        name: candidate.name,
        writer: candidate.writer,
        genre: candidate.genre?.trim() || 'Nao informado',
        nPages: candidate.nPages > 0 ? candidate.nPages : 1,
        yearPublication: candidate.yearPublication > 0 ? candidate.yearPublication : new Date().getFullYear(),
        isbn: candidate.isbn,
        publishingCompany: candidate.publishingCompany,
        img: candidate.img || undefined,
        synopsis: candidate.synopsis || undefined,
      };

      return this.apiService.createBook(payload).pipe(
        timeout(10000),
        map(book => ({ ok: true as const, book, candidate })),
        catchError((error: HttpErrorResponse) => of({ ok: false as const, error, candidate }))
      );
    });

    forkJoin(createRequests)
      .pipe(
        timeout(10000),
        catchError(() => {
          return of([] as { ok: boolean; book?: Book; error?: HttpErrorResponse; candidate: GoogleBookCandidate }[]);
        }),
        finalize(() => {
          this.zone.run(() => {
            this.bulkSaving = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe(results => {
        this.zone.run(() => {
          const isSuccess = (r: unknown): r is { ok: true; book: Book; candidate: GoogleBookCandidate } => 
            typeof r === 'object' && r !== null && 'ok' in r &&  (r as any).ok === true;
          
          const successBooks = results.filter(isSuccess).map(r => r.book);
          const failed = results.filter(r => !isSuccess(r));

          if (successBooks.length > 0) {
            this.books = [...successBooks, ...this.books];
          }

          const totalFailed = failed.length + invalidCandidates.length;

          // UX: close modal whenever at least one book was created.
          if (successBooks.length > 0) {
            this.closeModal();
            return;
          }

          this.googleError = `${successBooks.length} livro(s) cadastrado(s). ${totalFailed} nao cadastrado(s).`;

          const failedIds = new Set<string>([
            ...failed.map(r => r.candidate.googleId),
            ...invalidCandidates.map(c => c.googleId),
          ]);

          this.selectedGoogleIds.forEach(id => {
            if (!failedIds.has(id)) {
              this.selectedGoogleIds.delete(id);
            }
          });
        });
      });
  }

  onCompleteFilterToggle(): void {
    if (!this.showOnlyCompleteCandidates) return;

    this.selectedGoogleIds.forEach(id => {
      const candidate = this.googleResults.find(item => item.googleId === id);
      if (candidate && !this.isCandidateBulkValid(candidate)) {
        this.selectedGoogleIds.delete(id);
      }
    });
  }

  isCandidateBulkValid(candidate: GoogleBookCandidate): boolean {
    return Boolean(candidate.name?.trim() && candidate.writer?.trim() && candidate.isbn?.trim() && candidate.publishingCompany?.trim());
  }

  private fetchGooglePage(reset: boolean): void {
    const query = this.googleQuery.trim();
    if (query.length < 3) return;

    if (reset) {
      this.googleLoading = true;
      this.googleLoadingMore = false;
      this.googleStartIndex = 0;
      this.googleHasMore = true;
      this.selectedGoogleIds.clear();
    } else {
      this.googleLoadingMore = true;
    }

    const startIndex = reset ? 0 : this.googleStartIndex;

    this.googleBooks.search(query, startIndex, this.googlePageSize).pipe(
      timeout(10000),
      catchError(() => {
        this.zone.run(() => {
          this.googleError = 'Erro ao buscar livros. Pode haver problemas com a conexão.';
        });
        return of<GoogleBookCandidate[]>([]);
      })
    ).subscribe({
      next: results => {
        this.zone.run(() => {
          if (reset) {
            this.googleResults = results;
          } else {
            const existingIds = new Set(this.googleResults.map(item => item.googleId));
            const newResults = results.filter(item => !existingIds.has(item.googleId));
            this.googleResults = [...this.googleResults, ...newResults];
          }

          this.googleStartIndex = startIndex + results.length;
          this.googleHasMore = results.length === this.googlePageSize;

          if (reset && results.length === 0) {
            this.googleError = 'Nenhum resultado encontrado. Tente outro termo.';
          }

          this.googleLoading = false;
          this.googleLoadingMore = false;
          this.cdr.detectChanges();
        });
      },
      error: (err: HttpErrorResponse) => {
        this.zone.run(() => {
          console.error('Google Books error:', err);
          this.googleLoading = false;
          this.googleLoadingMore = false;
          const apiMessage = err?.error?.error?.message;
          this.googleError = apiMessage
            ? `Google Books: ${apiMessage}`
            : 'Erro ao buscar no Google Books. Verifique a conexão.';
          this.cdr.detectChanges();
        });
      },
    });
  }

  isAlreadyRegistered(candidate: GoogleBookCandidate): boolean {
    const isbn = this.normalizeIsbn(candidate.isbn);
    if (!isbn) return false;
    return this.existingIsbnSet.has(isbn);
  }

  private normalizeIsbn(isbn: string | undefined): string {
    if (!isbn) return '';
    return isbn.toUpperCase().replace(/[^0-9X]/g, '');
  }

  fillManually(): void {
    this.formMode = 'create';
    this.editingBookId = null;
    this.resetForm();
    this.coverPreviewUrl = '';
    this.modalStep = 'form';
  }

  openEditModal(book: Book, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.showModal = true;
    this.modalStep = 'form';
    this.formMode = 'edit';
    this.editingBookId = book.id;
    this.googleError = '';
    this.saveError = '';
    this.coverUploadError = '';
    this.selectedCoverName = '';
    this.coverUploadBusy = false;

    this.form = {
      name: book.name,
      writer: book.writer,
      genre: book.genre,
      nPages: book.nPages,
      yearPublication: book.yearPublication,
      isbn: book.isbn,
      publishingCompany: book.publishingCompany,
      img: book.img ?? '',
      synopsis: book.synopsis ?? '',
    };

    this.coverPreviewUrl = this.form.img || '';
  }

  backToSearch(): void {
    this.modalStep = 'search';
    this.saveError = '';
  }

  submitBook(): void {
    if (!this.form.name || !this.form.writer || !this.form.genre || !this.form.isbn || !this.form.publishingCompany) {
      this.saveError = 'Preencha todos os campos obrigatórios.';
      return;
    }
    this.saving = true;
    this.saveError = '';

    const payload: Omit<Book, 'id'> = {
      ...this.form,
      nPages: Number(this.form.nPages),
      yearPublication: Number(this.form.yearPublication),
      img: this.form.img || undefined,
      synopsis: this.form.synopsis || undefined,
    };

    const request$ = this.formMode === 'edit' && this.editingBookId
      ? this.apiService.updateBook(this.editingBookId, payload)
      : this.apiService.createBook(payload);

    request$.pipe(
      timeout(10000),
      catchError((err: HttpErrorResponse) => {
        this.zone.run(() => {
          this.saving = false;
          this.saveError = err?.error?.message || 'Erro ao cadastrar o livro. Tente novamente.';
          this.cdr.detectChanges();
        });
        return of(null);
      }),
      finalize(() => {
        if (this.saving) {
          this.zone.run(() => {
            this.saving = false;
            this.cdr.detectChanges();
          });
        }
      })
    ).subscribe({
      next: newBook => {
        this.zone.run(() => {
          if (newBook) {
            if (this.formMode === 'edit' && this.editingBookId) {
              this.books = this.books.map(book => (book.id === this.editingBookId ? newBook : book));
            } else {
              this.books = [newBook, ...this.books];
            }
            this.closeModal();
          }
          this.cdr.detectChanges();
        });
      },
    });
  }

  onCoverUrlChange(value: string): void {
    this.coverPreviewUrl = value?.trim() || '';
  }

  onCoverFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
    if (!allowedTypes.has(file.type)) {
      this.coverUploadError = 'Formato nao suportado. Use JPG, PNG, WEBP ou AVIF.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.coverUploadError = 'A capa deve ter no maximo 5MB.';
      input.value = '';
      return;
    }

    this.coverUploadBusy = true;
    this.coverUploadError = '';
    this.selectedCoverName = file.name;

    const localPreview = URL.createObjectURL(file);
    this.coverPreviewUrl = localPreview;

    this.apiService
      .createBookCoverUploadUrl(file.name, file.type)
      .pipe(
        timeout(15000),
        catchError((err: HttpErrorResponse) => {
          this.zone.run(() => {
            this.coverUploadBusy = false;
            this.coverUploadError = err?.error?.message || 'Nao foi possivel enviar a capa agora.';
            this.cdr.detectChanges();
          });
          return of(null);
        })
      )
      .subscribe((signed) => {
        if (!signed) {
          return;
        }

        this.apiService
          .uploadFileToSignedUrl(signed.uploadUrl, file)
          .pipe(
            timeout(15000),
            catchError((err: HttpErrorResponse) => {
              this.zone.run(() => {
                this.coverUploadBusy = false;
                this.coverUploadError = err?.error?.message || 'Falha ao enviar arquivo para o storage.';
                this.cdr.detectChanges();
              });
              return of(null);
            }),
            finalize(() => {
              this.zone.run(() => {
                if (this.coverUploadBusy) {
                  this.coverUploadBusy = false;
                  this.cdr.detectChanges();
                }
              });
            })
          )
          .subscribe((uploaded) => {
            this.zone.run(() => {
              if (uploaded === null) {
                return;
              }

              this.form.img = signed.publicUrl;
              this.coverPreviewUrl = signed.publicUrl;
              this.cdr.detectChanges();
            });
          });
      });
  }

  private resetForm(): void {
    this.form = {
      name: '', writer: '', genre: '', nPages: 0,
      yearPublication: new Date().getFullYear(),
      isbn: '', publishingCompany: '', img: '', synopsis: '',
    };
    this.coverPreviewUrl = '';
    this.coverUploadBusy = false;
    this.coverUploadError = '';
    this.selectedCoverName = '';
    this.formMode = 'create';
    this.editingBookId = null;
  }
}

