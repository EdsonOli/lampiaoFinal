import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, finalize, of, timeout } from 'rxjs';
import { ApiService, Post } from '../../core/services/api.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.css',
})
export class TimelineComponent implements OnInit {
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  posts: Post[] = [];
  loading = true;
  error = '';

  ngOnInit(): void {
    this.apiService
      .getPosts()
      .pipe(
        timeout(10000),
        catchError(() => {
          this.zone.run(() => {
            this.error = 'Não foi possível carregar os posts. Servidor pode estar indisponível.';
          });
          return of<Post[]>([]);
        }),
        finalize(() => {
          this.zone.run(() => {
            this.loading = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: posts => {
          this.zone.run(() => {
            this.posts = posts;
            this.cdr.detectChanges();
          });
        },
      });
  }
}
