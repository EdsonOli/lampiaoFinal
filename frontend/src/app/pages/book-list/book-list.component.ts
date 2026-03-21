import { ChangeDetectorRef, Component, NgZone, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, finalize, of, timeout, Subject, debounceTime, switchMap, takeUntil } from 'rxjs';
import { ApiService, Book, CreateBookFromSearchInput } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { IntegratedBookSearchService, BookSearchResult } from '../../core/services/integrated-book-search.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { StatusCardComponent } from '../../shared/status-card/status-card.component';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, StatusCardComponent],
  templateUrl: './book-list.component.html',
  styleUrl: './book-list.component.css',
})
export class BookListComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly integratedSearch = inject(IntegratedBookSearchService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // --- Busca e resultados ---
  searchQuery = '';
  searchResults: BookSearchResult[] = [];
  searchLoading = false;
  searchError = '';
  private readonly searchQuery$ = new Subject<string>();
  private readonly debounceMs = 400;
  private readonly pageSize = 20;
  private apiStartIndex = 0;
  apiHasMore = true;
  loadingMore = false;
  currentSearchSource: 'local' | 'api' | null = null;
  pendingBookActionId: string | null = null;

  get isAdmin(): boolean {
    return this.authService.currentUser?.role === 'admin';
  }

  // --- Modal para criar manualmente (apenas admin) ---
  showCreateModal = false;
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
    // Setup busca com debounce
    this.searchQuery$
      .pipe(
        debounceTime(this.debounceMs),
        switchMap((query) => {
          this.searchLoading = true;
          this.searchError = '';
          this.apiStartIndex = 0;
          this.apiHasMore = true;
          this.currentSearchSource = null;

          const trimmed = query.trim();
          if (!trimmed) {
            this.searchResults = [];
            this.searchLoading = false;
            return of<BookSearchResult[]>([]);
          }

          return this.integratedSearch.searchBooks(trimmed, 0, this.pageSize).pipe(
            timeout(10000),
            catchError(() => {
              this.zone.run(() => {
                this.searchError = 'Erro ao buscar livros. Verifique sua conexão.';
              });
              return of<BookSearchResult[]>([]);
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (results) => {
          this.zone.run(() => {
            this.searchResults = results;
            this.searchLoading = false;

            // Detect source from results
            if (results.length > 0) {
              this.currentSearchSource = results[0].source;
            }

            if (results.length === 0 && this.searchQuery.trim()) {
              this.searchError = 'Nenhum livro encontrado. Tente outro termo.';
            }

            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.zone.run(() => {
            this.searchLoading = false;
            this.cdr.detectChanges();
          });
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(value: string): void {
    this.searchQuery = value;
    this.searchQuery$.next(value);
  }

  onSearchScroll(event: Event): void {
    // Apenas scroll infinito se estamos em resultados de API
    if (this.currentSearchSource !== 'api') return;
    if (this.searchLoading || this.loadingMore || !this.apiHasMore) return;

    const target = event.target as HTMLElement;
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 100;

    if (nearBottom && this.searchQuery.trim()) {
      this.loadMoreResults();
    }
  }

  private loadMoreResults(): void {
    const query = this.searchQuery.trim();
    if (!query) return;

    this.loadingMore = true;
    this.integratedSearch
      .searchApisDirectly(query, this.apiStartIndex, this.pageSize)
      .pipe(
        timeout(10000),
        catchError(() => {
          this.zone.run(() => {
            this.searchError = 'Erro ao carregar mais resultados.';
          });
          return of<BookSearchResult[]>([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (results) => {
          this.zone.run(() => {
            const existingIds = new Set(this.searchResults.map((r) => this.getBookId(r.book)));
            const newResults = results.filter((r) => !existingIds.has(this.getBookId(r.book)));

            this.searchResults = [...this.searchResults, ...newResults];
            this.apiStartIndex += results.length;
            this.apiHasMore = results.length === this.pageSize;
            this.loadingMore = false;
            this.cdr.detectChanges();
          });
        },
      });
  }

  getBookId(book: any): string {
    return book.id || book.googleId;
  }
  
  isPendingBookResult(book: Book): boolean {
    return this.pendingBookActionId === this.getBookId(book);
  }
  
  getResultActionLabel(result: BookSearchResult): string {
    if (this.isPendingBookResult(result.book)) {
      return result.source === 'local' ? 'Abrindo...' : 'Adicionando...';
    }
  
    return result.source === 'local' ? 'Abrir detalhes' : '+ Adicionar';
  }

  private sanitizeIsbn(value: string): string {
    return value
      .split('')
      .filter((character) => /[0-9X]/.test(character))
      .join('');
  }

  private resolveImportIsbn(apiBook: any): string {
    const rawIsbn = String(apiBook?.isbn ?? '')
      .toUpperCase()
      .split('')
      .filter((character) => /[0-9X]/.test(character))
      .join('');

    if (rawIsbn.length >= 10 && rawIsbn.length <= 20) {
      return rawIsbn;
    }

    const sourceId = String(this.getBookId(apiBook) || `${apiBook?.name || 'BOOK'}-${apiBook?.writer || 'AUTHOR'}`)
      .toUpperCase()
      .split('')
      .filter((character) => /[A-Z0-9]/.test(character))
      .join('');

    return (`EXT${sourceId}`).padEnd(10, '0').slice(0, 20);
  }

  selectBook(result: BookSearchResult): void {
    if (this.pendingBookActionId) {
      return;
    }

    if (result.source === 'local') {
      this.router.navigate(['/livros', result.book.id]);
      return;
    }

    this.autoAddBook(result);
  }

  private autoAddBook(result: BookSearchResult): void {
    const apiBook = result.book;
    this.pendingBookActionId = this.getBookId(apiBook);
    this.searchError = '';

    const payload: CreateBookFromSearchInput = {
      name: (apiBook.name || 'Titulo nao informado').trim(),
      writer: (apiBook.writer || 'Autor desconhecido').trim(),
      genre: apiBook.genre?.trim() || 'Não informado',
      nPages: apiBook.nPages > 0 ? apiBook.nPages : 1,
      yearPublication: apiBook.yearPublication > 0 ? apiBook.yearPublication : new Date().getFullYear(),
      isbn: this.resolveImportIsbn(apiBook),
      publishingCompany: (apiBook.publishingCompany || 'Editora desconhecida').trim(),
      img: apiBook.img || undefined,
      synopsis: apiBook.synopsis || undefined,
      series: result.series
        ? {
            name: result.series.name,
            universeName: result.series.universeName,
            positionInSeries: result.series.positionInSeries,
            positionLabel: result.series.positionLabel,
            metadataSource: result.series.metadataSource,
            metadataConfidence: result.series.metadataConfidence,
          }
        : undefined,
    };

    this.apiService
      .createBookFromSearch(payload)
      .pipe(
        timeout(10000),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 409) {
            return this.apiService.getBooks().pipe(
              takeUntil(this.destroy$),
              catchError(() => of([] as Book[]))
            );
          }

          this.zone.run(() => {
            if (err.status === 401) {
              this.searchError = 'Faça login para adicionar livros ao acervo.';
            } else {
              this.searchError = err?.error?.message || 'Erro ao adicionar livro ao acervo.';
            }
            this.pendingBookActionId = null;
            this.cdr.detectChanges();
          });

          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (result) => {
          this.zone.run(() => {
            const createdBook = Array.isArray(result)
              ? this.findMatchingBook(result, payload)
              : result;

            if (createdBook) {
              const resultIndex = this.searchResults.findIndex(
                (r) => this.getBookId(r.book) === this.getBookId(apiBook)
              );
              if (resultIndex >= 0) {
                this.searchResults[resultIndex] = {
                  source: 'local',
                  book: createdBook,
                  alreadyExists: true,
                };
              }

              this.pendingBookActionId = null;
              this.cdr.detectChanges();
              this.router.navigate(['/livros', createdBook.id]);
              return;
            }

            this.pendingBookActionId = null;
            this.cdr.detectChanges();
          });
        },
      });
  }

  getSeriesHint(result: BookSearchResult): string {
    if (!result.series?.name) {
      return '';
    }

    const position = result.series.positionLabel ||
      (typeof result.series.positionInSeries === 'number' ? `Vol. ${result.series.positionInSeries}` : '');

    return position ? `${result.series.name} - ${position}` : result.series.name;
  }

  private findMatchingBook(books: Book[], payload: Omit<Book, 'id'>): Book | null {
    const normalizedIsbn = this.sanitizeIsbn(payload.isbn.toUpperCase());

    return books.find((book) => {
      const bookIsbn = this.sanitizeIsbn(String(book.isbn || '').toUpperCase());
      if (normalizedIsbn && bookIsbn === normalizedIsbn) {
        return true;
      }

      return (
        book.name.trim().toLowerCase() === payload.name.trim().toLowerCase() &&
        book.writer.trim().toLowerCase() === payload.writer.trim().toLowerCase()
      );
    }) || null;
  }

  openCreateModal(): void {
    if (!this.isAdmin) return;
    this.showCreateModal = true;
    this.resetForm();
    this.saveError = '';
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
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

    this.apiService
      .createBook(payload)
      .pipe(
        timeout(10000),
        catchError((err: HttpErrorResponse) => {
          this.zone.run(() => {
            this.saving = false;
            this.saveError = err?.error?.message || 'Erro ao cadastrar o livro.';
            this.cdr.detectChanges();
          });
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (createdBook) => {
          this.zone.run(() => {
            if (createdBook) {
              this.closeCreateModal();
            }
            this.saving = false;
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

    if (!file) return;

    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
    if (!allowedTypes.has(file.type)) {
      this.coverUploadError = 'Formato não suportado. Use JPG, PNG, WEBP ou AVIF.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.coverUploadError = 'A capa deve ter no máximo 5MB.';
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
            this.coverUploadError = err?.error?.message || 'Não foi possível enviar a capa agora.';
            this.cdr.detectChanges();
          });
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((signed) => {
        if (!signed) return;

        this.apiService
          .uploadFileToSignedUrl(signed.uploadUrl, file)
          .pipe(
            timeout(15000),
            catchError((err: HttpErrorResponse) => {
              this.zone.run(() => {
                this.coverUploadBusy = false;
                this.coverUploadError = err?.error?.message || 'Falha ao enviar arquivo.';
                this.cdr.detectChanges();
              });
              return of(null);
            }),
            finalize(() => {
              this.zone.run(() => {
                this.coverUploadBusy = false;
                this.cdr.detectChanges();
              });
            }),
            takeUntil(this.destroy$)
          )
          .subscribe((uploaded) => {
            this.zone.run(() => {
              if (uploaded !== null) {
                this.form.img = signed.publicUrl;
                this.coverPreviewUrl = signed.publicUrl;
              }
              this.cdr.detectChanges();
            });
          });
      });
  }

  private resetForm(): void {
    this.form = {
      name: '',
      writer: '',
      genre: '',
      nPages: 0,
      yearPublication: new Date().getFullYear(),
      isbn: '',
      publishingCompany: '',
      img: '',
      synopsis: '',
    };
    this.coverPreviewUrl = '';
    this.coverUploadBusy = false;
    this.coverUploadError = '';
    this.selectedCoverName = '';
  }
}

