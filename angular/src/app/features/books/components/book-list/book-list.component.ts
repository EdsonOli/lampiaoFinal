import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../services/book.service';
import { BookDto, GetBooksInput } from '../../models/book.model';
import { PagedResponse } from '../../../../shared/models/page-request.model';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './book-list.component.html',
  styleUrl: './book-list.component.scss'
})
export class BookListComponent implements OnInit {
  // Signals para estado reativo
  books = signal<BookDto[]>([]);
  loading = signal(false);
  totalCount = signal(0);
  
  // Filtros e paginação
  filter: GetBooksInput = {
    skipCount: 0,
    maxResultCount: 12,
    sorting: 'creationTime desc'
  };
  
  // Tabs
  activeTab: 'all' | 'top-rated' | 'most-favorited' | 'latest' = 'all';

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(): void {
    this.loading.set(true);
    
    const request = this.activeTab === 'all' 
      ? this.bookService.getList(this.filter)
      : this.loadSpecialList();

    request.subscribe({
      next: (response: PagedResponse<BookDto> | BookDto[]) => {
        if (Array.isArray(response)) {
          // Para listas especiais (top-rated, etc)
          this.books.set(response);
          this.totalCount.set(response.length);
        } else {
          // Para lista paginada normal
          this.books.set(response.items);
          this.totalCount.set(response.totalCount);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadSpecialList() {
    switch (this.activeTab) {
      case 'top-rated':
        return this.bookService.getTopRated(20);
      case 'most-favorited':
        return this.bookService.getMostFavorited(20);
      case 'latest':
        return this.bookService.getLatest(20);
      default:
        return this.bookService.getList(this.filter);
    }
  }

  selectTab(tab: typeof this.activeTab): void {
    this.activeTab = tab;
    this.filter.skipCount = 0; // Reset pagination
    this.loadBooks();
  }

  onSearch(query: string): void {
    if (query.length >= 2) {
      this.filter.filter = query;
      this.filter.skipCount = 0;
      this.loadBooks();
    } else if (query.length === 0) {
      this.filter.filter = undefined;
      this.loadBooks();
    }
  }

  onPageChange(page: number): void {
    this.filter.skipCount = (page - 1) * this.filter.maxResultCount!;
    this.loadBooks();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get currentPage(): number {
    return Math.floor(this.filter.skipCount! / this.filter.maxResultCount!) + 1;
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount() / this.filter.maxResultCount!);
  }
}
