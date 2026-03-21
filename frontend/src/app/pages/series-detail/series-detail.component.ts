import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { FormatDatePipe } from '../../shared/pipes/format-date.pipe';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService, SeriesNarrativePost } from '../../core/services/api.service';
import { normalizeApiErrorPayload } from '../../core/utils/api-error';
import { appLogger } from '../../core/utils/app-logger';
import { LOG_EVENTS } from '../../core/utils/log-events';

export interface SeriesWithBooks {
  id: string;
  name: string;
  universeName?: string;
  metadataSource?: string;
  metadataConfidence: 'low' | 'medium' | 'high';
  books: Array<{
    id: string;
    name: string;
    isbn: string;
    writer: string;
    img?: string;
    positionInSeries?: number;
    positionLabel?: string;
  }>;
}

@Component({
  selector: 'app-series-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FormatDatePipe],
  templateUrl: './series-detail.component.html',
  styleUrls: ['./series-detail.component.css'],
})
export class SeriesDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly apiService = inject(ApiService);
  private readonly destroy$ = new Subject<void>();

  series: SeriesWithBooks | null = null;
  loading = true;
  error: string | null = null;
  narrativeLoading = false;
  narrativeError: string | null = null;
  narrativePosts: SeriesNarrativePost[] = [];

  readonly creativePrompts = [
    'Escreva uma cena curta em que um leitor descobre um segredo deste universo em uma biblioteca vazia.',
    'Reescreva um conflito da série pelo ponto de vista de um personagem secundário.',
    'Crie um diálogo de 12 falas entre dois personagens que discordam sobre o destino do mundo.',
    'Escreva uma cena com objetivo, conflito e virada final para este universo.',
    'Imagine um capítulo perdido entre dois livros da série e descreva sua abertura em 1 parágrafo.',
  ];
  currentPrompt = this.creativePrompts[0];
  selectedWritingBookId = '';

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const seriesId = params['seriesId'];
      if (seriesId) {
        this.loadSeries(seriesId);
        this.loadNarrativePosts(seriesId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSeries(seriesId: string): void {
    this.loading = true;
    this.error = null;

    this.apiService.getSeriesWithBooks(seriesId).subscribe({
      next: (response: SeriesWithBooks) => {
        this.series = response;
        this.selectedWritingBookId = response.books?.[0]?.id ?? '';
        this.loading = false;
      },
      error: (err: unknown) => {
        const payload = normalizeApiErrorPayload(err);
        appLogger.warn(LOG_EVENTS.SERIES_DETAIL_LOAD_FAILED, 'Failed to load series detail', {
          seriesId,
          message: payload.message,
          code: payload.code,
          requestId: payload.requestId,
        });
        this.error = 'Série não encontrada ou erro ao carregar.';
        this.loading = false;
      },
    });
  }

  private loadNarrativePosts(seriesId: string): void {
    this.narrativeLoading = true;
    this.narrativeError = null;

    this.apiService.getSeriesNarrativePosts(seriesId, 24).subscribe({
      next: (posts) => {
        this.narrativePosts = posts;
        this.narrativeLoading = false;
      },
      error: (err: unknown) => {
        const payload = normalizeApiErrorPayload(err);
        appLogger.warn(LOG_EVENTS.SERIES_DETAIL_POSTS_LOAD_FAILED, 'Failed to load narrative posts for series', {
          seriesId,
          message: payload.message,
          code: payload.code,
          requestId: payload.requestId,
        });
        this.narrativeError = 'Nao foi possivel carregar a trilha narrativa desta serie.';
        this.narrativeLoading = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/livros']);
  }

  navigateToBook(bookId: string): void {
    this.router.navigate(['/livros', bookId]);
  }

  writeFromSeries(): void {
    const selectedBookId = this.selectedWritingBookId || this.series?.books?.[0]?.id;
    if (!selectedBookId) {
      return;
    }

    this.router.navigate(['/livros', selectedBookId], {
      queryParams: {
        compose: '1',
        prompt: this.currentPrompt,
        fromSeries: this.series?.id,
      },
    });
  }

  pickAnotherPrompt(): void {
    const options = this.creativePrompts.filter((prompt) => prompt !== this.currentPrompt);
    if (!options.length) {
      return;
    }

    this.currentPrompt = options[Math.floor(Math.random() * options.length)];
  }

  trackByPostId(_index: number, post: SeriesNarrativePost): string {
    return post.id;
  }

  /**
   * Retorna label de posição ou posição ordinária para exibição
   */
  getPositionLabel(book: SeriesWithBooks['books'][0]): string {
    if (book.positionLabel) {
      return book.positionLabel;
    }
    if (book.positionInSeries) {
      return `Livro ${book.positionInSeries}`;
    }
    return '';
  }

  /**
   * Estilo condicional para confiança de metadados
   */
  getConfidenceClass(confidence: string): string {
    return `confidence-${confidence}`;
  }
}
