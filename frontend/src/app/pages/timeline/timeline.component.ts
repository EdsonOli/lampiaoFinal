import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  posts: Post[] = [];
  loading = true;
  error = '';

  ngOnInit(): void {
    this.apiService.getPosts().subscribe({
      next: (posts) => {
        this.posts = posts;
        this.loading = false;
      },
      error: () => {
        this.error = 'Não foi possível carregar os posts.';
        this.loading = false;
      },
    });
  }
}
