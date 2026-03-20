import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { catchError, finalize, of, timeout } from 'rxjs';
import { ApiService, Book, Notebook, Post } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './book-detail.component.html',
  styleUrl: './book-detail.component.css',
})
export class BookDetailComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  book: Book | null = null;
  posts: Post[] = [];
  currentBookId = '';

  userNotebook: Notebook | null = null;
  notebookBusy = false;
  notebookError = '';

  readonly statusOptions: Notebook['status'][] = ['Lido', 'Lendo', 'Quero ler'];
  readonly starValues = [1, 2, 3, 4, 5];

  loading = true;
  error = '';
  postTitle = '';
  postText = '';
  postIsPublic = true;
  postBusy = false;
  postError = '';
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

  isMine(post: Post): boolean {
    return post.userId === this.currentUserId;
  }

  getPostAuthor(post: Post): string {
    if (this.isMine(post)) {
      return 'Você';
    }

    return this.postAuthors[post.userId] || `Usuário #${post.userId}`;
  }

  formatPostDate(post: Post): string {
    if (!post.createdAt) return 'Data indisponível';
    const date = new Date(post.createdAt);
    if (Number.isNaN(date.getTime())) return 'Data indisponível';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
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
