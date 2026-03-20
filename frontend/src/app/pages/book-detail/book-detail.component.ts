import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService, Book, Post } from '../../core/services/api.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './book-detail.component.html',
  styleUrl: './book-detail.component.css',
})
export class BookDetailComponent implements OnInit {
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);

  book: Book | null = null;
  posts: Post[] = [];
  loading = true;
  error = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (Number.isNaN(id)) {
      this.error = 'Livro não encontrado.';
      this.loading = false;
      return;
    }

    forkJoin({
      book: this.apiService.getBookById(id),
      posts: this.apiService.getPosts(),
    }).subscribe({
      next: ({ book, posts }) => {
        this.book = book;
        this.posts = posts.filter(p => p.bookId === id);
        this.loading = false;
      },
      error: () => {
        this.error = 'Não foi possível carregar o livro.';
        this.loading = false;
      },
    });
  }
}
