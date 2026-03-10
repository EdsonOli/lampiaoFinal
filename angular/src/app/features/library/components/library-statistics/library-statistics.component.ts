import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserBookService } from '../../services/user-book.service';
import { LibraryStatisticsDto } from '../../models/user-book.model';

@Component({
  selector: 'app-library-statistics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './library-statistics.component.html',
  styleUrl: './library-statistics.component.scss'
})
export class LibraryStatisticsComponent implements OnInit {
  statistics = signal<LibraryStatisticsDto | null>(null);
  loading = signal(true);

  constructor(private userBookService: UserBookService) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.loading.set(true);
    
    this.userBookService.getMyStatistics().subscribe({
      next: (stats) => {
        this.statistics.set(stats);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  get readingProgress(): number {
    const stats = this.statistics();
    if (!stats || stats.totalBooks === 0) return 0;
    return Math.round((stats.booksRead / stats.totalBooks) * 100);
  }

  get currentlyReadingPercentage(): number {
    const stats = this.statistics();
    if (!stats || stats.totalBooks === 0) return 0;
    return Math.round((stats.booksReading / stats.totalBooks) * 100);
  }
}
