import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BookService } from '../../services/book.service';
import { UserBookService } from '../../../library/services/user-book.service';
import { BookDto, BookStatisticsDto } from '../../models/book.model';
import { UserBookDto, ReadingStatus, ReadingStatusLabels } from '../../../library/models/user-book.model';
import { ConfigStateService } from '@abp/ng.core';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './book-detail.component.html',
  styleUrl: './book-detail.component.scss'
})
export class BookDetailComponent implements OnInit {
  book = signal<BookDto | null>(null);
  statistics = signal<BookStatisticsDto | null>(null);
  userBook = signal<UserBookDto | null>(null);
  loading = signal(true);
  
  isAuthenticated = signal(false);
  ReadingStatus = ReadingStatus;
  ReadingStatusLabels = ReadingStatusLabels;

  constructor(
    private route: ActivatedRoute,
    private bookService: BookService,
    private userBookService: UserBookService,
    private configState: ConfigStateService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated.set(this.configState.getOne('currentUser')?.isAuthenticated ?? false);
    
    const bookId = this.route.snapshot.paramMap.get('id')!;
    this.loadBookDetails(bookId);
  }

  loadBookDetails(bookId: string): void {
    this.loading.set(true);
    
    // Carregar livro
    this.bookService.get(bookId).subscribe({
      next: (book) => {
        this.book.set(book);
        this.loading.set(false);
      }
    });

    // Carregar estatísticas
    this.bookService.getStatistics(bookId).subscribe({
      next: (stats) => this.statistics.set(stats)
    });

    // Verificar se está na biblioteca do usuário
    if (this.isAuthenticated()) {
      this.userBookService.checkInLibrary(bookId).subscribe({
        next: (userBook) => this.userBook.set(userBook)
      });
    }
  }

  addToLibrary(status: ReadingStatus): void {
    const bookId = this.book()!.id;
    
    this.userBookService.addToLibrary({
      bookId,
      readingStatus: status,
      isFavorite: false
    }).subscribe({
      next: (userBook) => {
        this.userBook.set(userBook);
        // Mostrar toast de sucesso
      }
    });
  }

  updateStatus(status: ReadingStatus): void {
    const userBookId = this.userBook()!.id;
    
    this.userBookService.updateReadingStatus(userBookId, status).subscribe({
      next: (updated) => {
        this.userBook.set(updated);
      }
    });
  }

  toggleFavorite(): void {
    const userBookId = this.userBook()!.id;
    
    this.userBookService.toggleFavorite(userBookId).subscribe({
      next: (updated) => {
        this.userBook.set(updated);
      }
    });
  }

  rateBook(rating: number): void {
    const userBookId = this.userBook()!.id;
    
    this.userBookService.rateBook(userBookId, rating).subscribe({
      next: (updated) => {
        this.userBook.set(updated);
        // Recarregar estatísticas
        this.bookService.getStatistics(this.book()!.id).subscribe({
          next: (stats) => this.statistics.set(stats)
        });
      }
    });
  }

  removeFromLibrary(): void {
    const userBookId = this.userBook()!.id;
    
    this.userBookService.removeFromLibrary(userBookId).subscribe({
      next: () => {
        this.userBook.set(null);
      }
    });
  }
}
