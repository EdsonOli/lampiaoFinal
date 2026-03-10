import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PostService } from '../../services/post.service';
import { BookService } from '../../../books/services/book.service';
import { BookDto } from '../../../books/models/book.model';
import { PostDto } from '../../models/post.model';

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './post-form.component.html',
  styleUrl: './post-form.component.scss'
})
export class PostFormComponent implements OnInit {
  postForm: FormGroup;
  isEditMode = signal(false);
  loading = signal(false);
  submitting = signal(false);
  
  books = signal<BookDto[]>([]);
  loadingBooks = signal(false);
  searchQuery = signal('');

  private postId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private postService: PostService,
    private bookService: BookService
  ) {
    this.postForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
      bookId: [null],
      isPublic: [true]
    });
  }

  ngOnInit(): void {
    this.postId = this.route.snapshot.paramMap.get('id');
    
    if (this.postId) {
      this.isEditMode.set(true);
      this.loadPost(this.postId);
    }

    this.loadBooks();
  }

  loadPost(id: string): void {
    this.loading.set(true);
    
    this.postService.get(id).subscribe({
      next: (post: PostDto) => {
        this.postForm.patchValue({
          title: post.title,
          content: post.content,
          bookId: post.bookId,
          isPublic: post.isPublic
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        alert('Erro ao carregar post.');
        this.router.navigate(['/social']);
      }
    });
  }

  loadBooks(): void {
    this.loadingBooks.set(true);
    
    this.bookService.getList({
      skipCount: 0,
      maxResultCount: 50,
      sorting: 'name asc'
    }).subscribe({
      next: (response) => {
        this.books.set(response.items);
        this.loadingBooks.set(false);
      },
      error: () => {
        this.loadingBooks.set(false);
      }
    });
  }

  searchBooks(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);

    if (query.length < 2) {
      this.loadBooks();
      return;
    }

    this.loadingBooks.set(true);
    
    this.bookService.search(query).subscribe({
      next: (books) => {
        this.books.set(books);
        this.loadingBooks.set(false);
      },
      error: () => {
        this.loadingBooks.set(false);
      }
    });
  }

  onSubmit(): void {
    if (!this.postForm.valid) {
      this.postForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const dto = this.postForm.value;

    const request$ = this.isEditMode() && this.postId
      ? this.postService.update(this.postId, dto)
      : this.postService.create(dto);

    request$.subscribe({
      next: (post) => {
        alert(`Post ${this.isEditMode() ? 'atualizado' : 'criado'} com sucesso!`);
        this.router.navigate(['/social/posts', post.id]);
      },
      error: () => {
        this.submitting.set(false);
        alert('Erro ao salvar post.');
      }
    });
  }

  cancel(): void {
    if (confirm('Deseja descartar as alterações?')) {
      this.router.navigate(['/social']);
    }
  }

  get title() { return this.postForm.get('title'); }
  get content() { return this.postForm.get('content'); }
}
