import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of, timeout } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { StatusCardComponent } from '../../shared/status-card/status-card.component';

export interface SeriesSummary {
  id: string;
  name: string;
  universeName?: string;
  bookCount: number;
}

@Component({
  selector: 'app-series-list',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, StatusCardComponent],
  templateUrl: './series-list.component.html',
  styleUrl: './series-list.component.css',
})
export class SeriesListComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);

  series: SeriesSummary[] = [];
  loading = true;
  error = '';

  ngOnInit(): void {
    this.apiService
      .listAllSeries()
      .pipe(
        timeout(10000),
        catchError(() => {
          this.zone.run(() => {
            this.error = 'Não foi possível carregar as séries. Servidor pode estar indisponível.';
          });
          return of<SeriesSummary[]>([]);
        }),
        finalize(() => {
          this.zone.run(() => {
            this.loading = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: (series) => {
          this.zone.run(() => {
            this.series = series as SeriesSummary[];
            this.cdr.detectChanges();
          });
        },
      });
  }
}
