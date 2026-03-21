import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of, timeout } from 'rxjs';
import { ApiService, Book, Post } from '../../core/services/api.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { StatusCardComponent } from '../../shared/status-card/status-card.component';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, StatusCardComponent],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.css',
})
export class TimelineComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);

  posts: Post[] = [];
  bookMap: Record<string, Book> = {};
  loading = true;
  error = '';

  ngOnInit(): void {
    forkJoin({
      posts: this.apiService.getPosts().pipe(timeout(10000), catchError(() => of<Post[]>([]))),
      books: this.apiService.getBooks().pipe(timeout(10000), catchError(() => of<Book[]>([]))),
    })
      .pipe(
        catchError(() => {
          this.zone.run(() => {
            this.error = 'Não foi possível carregar os posts. Servidor pode estar indisponível.';
          });
          return of({ posts: [] as Post[], books: [] as Book[] });
        }),
        finalize(() => {
          this.zone.run(() => {
            this.loading = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: ({ posts, books }) => {
          this.zone.run(() => {
            this.posts = posts;
            this.bookMap = Object.fromEntries(books.map(b => [b.id, b]));
            this.cdr.detectChanges();
          });
        },
      });
  }

  getBookName(bookId: string): string {
    return this.bookMap[bookId]?.name ?? 'Livro';
  }
}
