import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, of, timeout } from 'rxjs';
import { ApiService, Book, BookSeriesContext, Notebook, Post } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { FormatDatePipe } from '../../shared/pipes/format-date.pipe';
import { StatusCardComponent } from '../../shared/status-card/status-card.component';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FormatDatePipe, StatusCardComponent],
  templateUrl: './book-detail.component.html',
  styleUrl: './book-detail.component.css',
})
export class BookDetailComponent implements OnInit, OnDestroy {
  private static readonly MAX_STORY_WORDS = 40000;
  private static readonly DRAFT_SYNC_DEBOUNCE_MS = 900;
  private static readonly DRAFT_DEVICE_KEY = 'lampiao:device-id';
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);
  private draftSyncTimer: ReturnType<typeof setTimeout> | null = null;

  book: Book | null = null;
  posts: Post[] = [];
  currentBookId = '';

  userNotebook: Notebook | null = null;
  notebookBusy = false;
  notebookError = '';
  seriesContext: BookSeriesContext[] = [];
  seriesLoading = false;
  seriesError = '';

  readonly statusOptions: Notebook['status'][] = ['Lido', 'Lendo', 'Quero ler'];
  readonly starValues = [1, 2, 3, 4, 5];

  loading = true;
  error = '';
  postTitle = '';
  postText = '';
  postIsPublic = true;
  postBusy = false;
  postError = '';
  writingPrompt = '';
  writingSeriesId = '';
  draftFeedback = '';
  postFilter: 'all' | 'public' | 'mine' = 'all';
  postAuthors: Record<string, string> = {};

  editingPostId: string | null = null;
  editingTitle = '';
  editingText = '';
  editingIsPublic = true;
  postActionBusy = false;
  pendingDeletePostId: string | null = null;

  get canRate(): boolean {
    return this.userNotebook?.status === 'Lido';
  }

  get currentUserId(): string | null {
    return this.authService.currentUser?.id ?? null;
  }

  get filteredPosts(): Post[] {
    if (this.postFilter === 'public') {
      return this.posts.filter(post => post.isItPublic);
    }

    if (this.postFilter === 'mine') {
      return this.posts.filter(post => post.userId === this.currentUserId);
    }

    return this.posts;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    if (!id) {
      this.error = 'Livro não encontrado.';
      this.loading = false;
      return;
    }

    this.currentBookId = id;
    this.loadNotebookState(id);
    this.loadSeriesContext(id);
    this.applyWritingOnboardingFromQuery();
    this.restorePostDraft();

    this.apiService
      .getBookById(id)
      .pipe(
        timeout(10000),
        catchError(() => {
          this.zone.run(() => {
            this.error = 'Não foi possível carregar o livro. Servidor pode estar indisponível.';
          });
          return of<Book | null>(null);
        }),
        finalize(() => {
          this.zone.run(() => {
            this.loading = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: book => {
          this.zone.run(() => {
            this.book = book;
            if (book) this.loadPosts(id);
          });
        },
      });
  }

  ngOnDestroy(): void {
    if (this.draftSyncTimer) {
      clearTimeout(this.draftSyncTimer);
      this.draftSyncTimer = null;
    }
  }

  addToNotebook(): void {
    if (!this.currentBookId || this.notebookBusy) return;
    this.notebookError = '';
    this.notebookBusy = true;

    this.apiService
      .createNotebook({
        bookId: this.currentBookId,
        status: 'Quero ler',
        favorite: false,
      })
      .pipe(
        timeout(10000),
        catchError((err) => {
          this.notebookError = err?.error?.message || 'Não foi possível adicionar o livro na estante.';
          return of(null);
        }),
        finalize(() => {
          this.zone.run(() => {
            this.notebookBusy = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: notebook => {
          this.zone.run(() => {
            if (notebook) {
              this.userNotebook = notebook;
              this.notebookError = '';
            }
          });
        },
      });
  }

  setStatus(status: Notebook['status']): void {
    if (this.notebookBusy) return;

    if (!this.userNotebook) {
      this.createNotebookWithStatus(status);
      return;
    }

    this.notebookError = '';
    this.notebookBusy = true;

    this.apiService
      .updateNotebook(this.userNotebook.id, { status })
      .pipe(
        timeout(10000),
        catchError((err) => {
          this.notebookError = err?.error?.message || 'Não foi possível atualizar o status.';
          return of(null);
        }),
        finalize(() => {
          this.zone.run(() => {
            this.notebookBusy = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: notebook => {
          this.zone.run(() => {
            if (notebook) this.userNotebook = notebook;
          });
        },
      });
  }

  toggleFavorite(): void {
    if (!this.userNotebook || this.notebookBusy) {
      if (!this.userNotebook) {
        this.notebookError = 'Adicione o livro na estante antes de favoritar.';
      }
      return;
    }

    this.notebookError = '';
    this.notebookBusy = true;

    this.apiService
      .updateNotebook(this.userNotebook.id, {
        favorite: !this.userNotebook.favorite,
      })
      .pipe(
        timeout(10000),
        catchError((err) => {
          this.notebookError = err?.error?.message || 'Não foi possível atualizar favorito.';
          return of(null);
        }),
        finalize(() => {
          this.zone.run(() => {
            this.notebookBusy = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: notebook => {
          this.zone.run(() => {
            if (notebook) this.userNotebook = notebook;
          });
        },
      });
  }

  setGrade(grade: number): void {
    if (!this.userNotebook || this.notebookBusy) {
      if (!this.userNotebook) {
        this.notebookError = 'Adicione o livro na estante antes de avaliar.';
      }
      return;
    }

    if (!this.canRate) {
      this.notebookError = 'Mude o status para "Lido" para avaliar.';
      return;
    }

    this.notebookError = '';
    this.notebookBusy = true;

    this.apiService
      .updateNotebook(this.userNotebook.id, { grade })
      .pipe(
        timeout(10000),
        catchError((err) => {
          this.notebookError = err?.error?.message || 'Não foi possível atualizar a avaliação.';
          return of(null);
        }),
        finalize(() => {
          this.zone.run(() => {
            this.notebookBusy = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: notebook => {
          this.zone.run(() => {
            if (notebook) this.userNotebook = notebook;
          });
        },
      });
  }

  isStarActive(value: number): boolean {
    return (this.userNotebook?.grade ?? 0) >= value;
  }

  submitPost(): void {
    if (!this.currentBookId || this.postBusy) return;

    const title = this.postTitle.trim();
    const text = this.postText.trim();

    if (!title || !text) {
      this.postError = 'Preencha título e texto para publicar.';
      return;
    }

    if (this.isOverStoryWordLimit) {
      this.postError = `Este texto ultrapassa o limite de ${BookDetailComponent.MAX_STORY_WORDS.toLocaleString('pt-BR')} palavras.`;
      return;
    }

    this.postBusy = true;
    this.postError = '';

    this.apiService
      .createPost({
        title,
        text,
        bookId: this.currentBookId,
        isItPublic: this.postIsPublic,
      })
      .pipe(
        finalize(() => {
          this.zone.run(() => {
            this.postBusy = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: post => {
          this.zone.run(() => {
            this.posts = [post, ...this.posts];
            this.postTitle = '';
            this.postText = '';
            this.postIsPublic = true;
            this.postError = '';
            this.clearPostDraft();
            this.loadAuthorsForPosts([post]);
          });
        },
        error: (err: HttpErrorResponse) => {
          this.zone.run(() => {
            this.postError = err?.error?.message || 'Não foi possível publicar o post.';
          });
        },
      });
  }

  onPostDraftChange(): void {
    this.persistPostDraft();
    this.scheduleDraftSync();
  }

  clearDraftManually(): void {
    this.clearPostDraft();
    this.draftFeedback = 'Rascunho limpo.';
  }

  isMine(post: Post): boolean {
    return post.userId === this.currentUserId;
  }

  getPostAuthor(post: Post): string {
    if (this.isMine(post)) {
      return 'Você';
    }

    return this.postAuthors[post.userId] || `Usuário #${post.userId}`;
  }

  startEditing(post: Post): void {
    if (!this.isMine(post) || this.postActionBusy) return;
    this.pendingDeletePostId = null;
    this.editingPostId = post.id;
    this.editingTitle = post.title;
    this.editingText = post.text;
    this.editingIsPublic = post.isItPublic;
    this.postError = '';
  }

  cancelEditing(): void {
    this.editingPostId = null;
    this.editingTitle = '';
    this.editingText = '';
    this.editingIsPublic = true;
  }

  saveEditing(): void {
    if (!this.editingPostId || this.postActionBusy) return;

    const title = this.editingTitle.trim();
    const text = this.editingText.trim();

    if (!title || !text) {
      this.postError = 'Preencha título e texto para salvar alterações.';
      return;
    }

    this.postActionBusy = true;
    this.postError = '';

    this.apiService
      .updatePost(this.editingPostId, {
        title,
        text,
        isItPublic: this.editingIsPublic,
      })
      .pipe(
        finalize(() => {
          this.zone.run(() => {
            this.postActionBusy = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: updated => {
          this.zone.run(() => {
            this.posts = this.posts.map(post => (post.id === updated.id ? updated : post));
            this.cancelEditing();
          });
        },
        error: (err: HttpErrorResponse) => {
          this.zone.run(() => {
            this.postError = err?.error?.message || 'Não foi possível salvar as alterações do post.';
          });
        },
      });
  }

  deletePost(post: Post): void {
    if (!this.isMine(post) || this.postActionBusy || this.pendingDeletePostId !== post.id) return;

    this.postActionBusy = true;
    this.postError = '';

    this.apiService
      .deletePost(post.id)
      .pipe(
        finalize(() => {
          this.zone.run(() => {
            this.postActionBusy = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: () => {
          this.zone.run(() => {
            this.posts = this.posts.filter(item => item.id !== post.id);
            this.pendingDeletePostId = null;
            if (this.editingPostId === post.id) {
              this.cancelEditing();
            }
          });
        },
        error: (err: HttpErrorResponse) => {
          this.zone.run(() => {
            this.postError = err?.error?.message || 'Não foi possível excluir o post.';
          });
        },
      });
  }

  askDelete(post: Post): void {
    if (!this.isMine(post) || this.postActionBusy) return;
    this.cancelEditing();
    this.pendingDeletePostId = post.id;
    this.postError = '';
  }

  cancelDelete(): void {
    this.pendingDeletePostId = null;
  }

  goToSeries(seriesId: string): void {
    if (!seriesId) return;
    this.router.navigate(['/series', seriesId]);
  }

  get hasWritingOnboarding(): boolean {
    return Boolean(this.writingPrompt || this.writingSeriesId);
  }

  get postWordCount(): number {
    return this.countWords(this.postText);
  }

  get storyLengthHint(): string {
    const count = this.postWordCount;
    if (!count) {
      return 'Comece a escrever: você pode publicar contos, novelas ou capítulos.';
    }

    const remaining = BookDetailComponent.MAX_STORY_WORDS - count;
    if (remaining >= 0) {
      return `Você ainda pode escrever ${remaining.toLocaleString('pt-BR')} palavras nesta publicação.`;
    }

    return `Você excedeu o limite em ${Math.abs(remaining).toLocaleString('pt-BR')} palavras.`;
  }

  get storyLengthStatusClass(): string {
    const count = this.postWordCount;
    if (!count) return 'story-status-idle';
    if (count <= BookDetailComponent.MAX_STORY_WORDS) return 'story-status-ok';
    return 'story-status-high';
  }

  get isOverStoryWordLimit(): boolean {
    return this.postWordCount > BookDetailComponent.MAX_STORY_WORDS;
  }

  private applyWritingOnboardingFromQuery(): void {
    const compose = this.route.snapshot.queryParamMap.get('compose');
    const prompt = this.route.snapshot.queryParamMap.get('prompt')?.trim() || '';
    const seriesId = this.route.snapshot.queryParamMap.get('fromSeries')?.trim() || '';

    if (compose !== '1') {
      return;
    }

    this.writingPrompt = prompt;
    this.writingSeriesId = seriesId;

    if (!this.postTitle.trim()) {
      this.postTitle = 'Minha primeira cena neste universo';
    }

    if (prompt && !this.postText.trim()) {
      this.postText = `${prompt}\n\n`;
    }

    this.persistPostDraft();
  }

  get hasDraft(): boolean {
    return Boolean(this.postTitle.trim() || this.postText.trim());
  }

  private get postDraftStorageKey(): string {
    const userId = this.currentUserId || 'anonymous';
    return `lampiao:post-draft:${userId}:${this.currentBookId}`;
  }

  private restorePostDraft(): void {
    if (!isPlatformBrowser(this.platformId) || !this.currentBookId) {
      return;
    }

    const deviceId = this.getOrCreateDeviceId();

    this.apiService
      .getPostDraft(this.currentBookId, deviceId)
      .pipe(
        timeout(8000),
        catchError(() => of({ draft: null }))
      )
      .subscribe(({ draft }) => {
        this.zone.run(() => {
          if (draft) {
            if (!this.postTitle.trim() && draft.title) {
              this.postTitle = draft.title;
            }
            if (!this.postText.trim() && draft.text) {
              this.postText = draft.text;
            }
            if (typeof draft.isItPublic === 'boolean') {
              this.postIsPublic = draft.isItPublic;
            }
            this.draftFeedback = 'Rascunho sincronizado restaurado.';
            this.persistPostDraft();
            this.cdr.detectChanges();
            return;
          }

          this.restorePostDraftFromLocal();
          this.cdr.detectChanges();
        });
      });
  }

  private restorePostDraftFromLocal(): void {
    if (!isPlatformBrowser(this.platformId) || !this.currentBookId) {
      return;
    }

    const raw = localStorage.getItem(this.postDraftStorageKey);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { title?: string; text?: string; isPublic?: boolean };
      if (!this.postTitle.trim() && parsed.title) {
        this.postTitle = parsed.title;
      }
      if (!this.postText.trim() && parsed.text) {
        this.postText = parsed.text;
      }
      if (typeof parsed.isPublic === 'boolean') {
        this.postIsPublic = parsed.isPublic;
      }
      this.draftFeedback = 'Rascunho restaurado automaticamente.';
    } catch {
      localStorage.removeItem(this.postDraftStorageKey);
    }
  }

  private persistPostDraft(): void {
    if (!isPlatformBrowser(this.platformId) || !this.currentBookId) {
      return;
    }

    const payload = {
      title: this.postTitle,
      text: this.postText,
      isPublic: this.postIsPublic,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(this.postDraftStorageKey, JSON.stringify(payload));
    this.draftFeedback = 'Rascunho salvo automaticamente.';
  }

  private clearPostDraft(): void {
    if (!isPlatformBrowser(this.platformId) || !this.currentBookId) {
      return;
    }

    localStorage.removeItem(this.postDraftStorageKey);
    const deviceId = this.getOrCreateDeviceId();
    this.apiService
      .deletePostDraft(this.currentBookId, deviceId)
      .pipe(
        timeout(8000),
        catchError(() => of(void 0))
      )
      .subscribe();
    this.draftFeedback = '';
  }

  private scheduleDraftSync(): void {
    if (!isPlatformBrowser(this.platformId) || !this.currentBookId) {
      return;
    }

    if (this.draftSyncTimer) {
      clearTimeout(this.draftSyncTimer);
    }

    this.draftSyncTimer = setTimeout(() => {
      this.syncDraftToBackend(this.postTitle, this.postText, this.postIsPublic);
      this.draftSyncTimer = null;
    }, BookDetailComponent.DRAFT_SYNC_DEBOUNCE_MS);
  }

  private syncDraftToBackend(title: string, text: string, isItPublic: boolean): void {
    if (!isPlatformBrowser(this.platformId) || !this.currentBookId) {
      return;
    }

    const deviceId = this.getOrCreateDeviceId();

    this.apiService
      .savePostDraft(this.currentBookId, {
        deviceId,
        title,
        text,
        isItPublic,
      })
      .pipe(
        timeout(8000),
        catchError(() => of(null))
      )
      .subscribe((draft) => {
        if (!draft) {
          return;
        }

        this.zone.run(() => {
          this.draftFeedback = 'Rascunho salvo e sincronizado.';
          this.cdr.detectChanges();
        });
      });
  }

  private getOrCreateDeviceId(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return 'server-device';
    }

    const existing = localStorage.getItem(BookDetailComponent.DRAFT_DEVICE_KEY);
    if (existing) {
      return existing;
    }

    const generated = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    localStorage.setItem(BookDetailComponent.DRAFT_DEVICE_KEY, generated);
    return generated;
  }

  private countWords(value: string): number {
    return value
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .length;
  }

  private loadNotebookState(bookId: string): void {
    this.apiService
      .getMyNotebooks()
      .pipe(
        timeout(10000),
        catchError(() => of<Notebook[]>([]))
      )
      .subscribe(notebooks => {
        this.zone.run(() => {
          this.userNotebook = notebooks.find(n => n.bookId === bookId) ?? null;
          this.cdr.detectChanges();
        });
      });
  }

  private loadSeriesContext(bookId: string): void {
    this.seriesLoading = true;
    this.seriesError = '';

    this.apiService
      .getSeriesForBook(bookId)
      .pipe(
        timeout(10000),
        catchError(() => {
          this.seriesError = 'Não foi possível carregar contexto de série agora.';
          return of([] as BookSeriesContext[]);
        }),
        finalize(() => {
          this.zone.run(() => {
            this.seriesLoading = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe(series => {
        this.zone.run(() => {
          this.seriesContext = series;
          this.cdr.detectChanges();
        });
      });
  }

  private createNotebookWithStatus(status: Notebook['status']): void {
    if (!this.currentBookId) return;

    this.notebookError = '';
    this.notebookBusy = true;

    this.apiService
      .createNotebook({
        bookId: this.currentBookId,
        status,
        favorite: false,
      })
      .pipe(
        finalize(() => {
          this.zone.run(() => {
            this.notebookBusy = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: notebook => {
          this.zone.run(() => {
            this.userNotebook = notebook;
          });
        },
        error: (err: HttpErrorResponse) => {
          this.zone.run(() => {
            this.notebookError = err?.error?.message || 'Não foi possível atualizar o status.';
          });
        },
      });
  }

  private loadPosts(bookId: string): void {
    this.apiService
      .getPostsByBook(bookId)
      .pipe(
        timeout(10000),
        catchError(() => of([] as Post[]))
      )
      .subscribe(posts => {
        this.zone.run(() => {
          this.posts = [...posts].sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
          });
          this.loadAuthorsForPosts(posts);
          this.cdr.detectChanges();
        });
      });
  }

  private loadAuthorsForPosts(posts: Post[]): void {
    const missingUserIds = [...new Set(posts.map(post => post.userId))].filter(id => !this.postAuthors[id]);

    if (missingUserIds.length === 0) return;

    missingUserIds.forEach(userId => {
      this.apiService
        .getUserById(userId)
        .pipe(
          timeout(10000),
          catchError(() => of(null))
        )
        .subscribe(user => {
          this.zone.run(() => {
            this.postAuthors[userId] = user?.nickname || user?.name || `Usuário #${userId}`;
            this.cdr.detectChanges();
          });
        });
    });
  }
}
