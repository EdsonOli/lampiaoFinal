import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserBookService } from '../../services/user-book.service';
import { UserBookDto, ReadingStatus, ReadingStatusLabels, ReadingStatusColors } from '../../models/user-book.model';
import { PagedResponse } from '../../../../shared/models/page-request.model';

@Component({
  selector: 'app-library-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './library-list.component.html',
  styleUrl: './library-list.component.scss'
})
export class LibraryListComponent implements OnInit {
  userBooks = signal<UserBookDto[]>([]);
  loading = signal(false);
  totalCount = signal(0);
  
  // Filtros
  selectedStatus = signal<ReadingStatus | 'all'>('all');
  showFavoritesOnly = signal(false);
  
  ReadingStatus = ReadingStatus;
  ReadingStatusLabels = ReadingStatusLabels;
  ReadingStatusColors = ReadingStatusColors;

  constructor(private userBookService: UserBookService) {}

  ngOnInit(): void {
    this.loadLibrary();
  }

  loadLibrary(): void {
    this.loading.set(true);
    
    const filters: any = {
      skipCount: 0,
      maxResultCount: 50,
      sorting: 'creationTime desc'
    };

    if (this.selectedStatus() !== 'all') {
      filters.readingStatus = this.selectedStatus();
    }

    if (this.showFavoritesOnly()) {
      filters.isFavorite = true;
    }

    this.userBookService.getMyLibrary(filters).subscribe({
      next: (response: PagedResponse<UserBookDto>) => {
        this.userBooks.set(response.items);
        this.totalCount.set(response.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  filterByStatus(status: ReadingStatus | 'all'): void {
    this.selectedStatus.set(status);
    this.loadLibrary();
  }

  toggleFavoritesFilter(): void {
    this.showFavoritesOnly.set(!this.showFavoritesOnly());
    this.loadLibrary();
  }

  getStatusBadgeClass(status: ReadingStatus): string {
    return `bg-${ReadingStatusColors[status]}`;
  }

  getBooksByStatus(status: ReadingStatus): UserBookDto[] {
    return this.userBooks().filter(ub => ub.readingStatus === status);
  }

  get booksWantToRead(): number {
    return this.getBooksByStatus(ReadingStatus.WantToRead).length;
  }

  get booksReading(): number {
    return this.getBooksByStatus(ReadingStatus.Reading).length;
  }

  get booksRead(): number {
    return this.getBooksByStatus(ReadingStatus.Read).length;
  }
}
