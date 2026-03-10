import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PostService } from '../../services/post.service';
import { PostDto } from '../../models/post.model';
import { PagedResponse } from '../../../../shared/models/page-request.model';
import { ConfigStateService } from '@abp/ng.core';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss'
})
export class TimelineComponent implements OnInit {
  posts = signal<PostDto[]>([]);
  loading = signal(false);
  totalCount = signal(0);
  
  filter = {
    skipCount: 0,
    maxResultCount: 10,
    sorting: 'creationTime desc'
  };

  isAuthenticated = signal(false);

  constructor(
    private postService: PostService,
    private configState: ConfigStateService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated.set(this.configState.getOne('currentUser')?.isAuthenticated ?? false);
    this.loadTimeline();
  }

  loadTimeline(): void {
    this.loading.set(true);
    
    this.postService.getTimeline(this.filter).subscribe({
      next: (response: PagedResponse<PostDto>) => {
        this.posts.set(response.items);
        this.totalCount.set(response.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  toggleLike(post: PostDto): void {
    if (!this.isAuthenticated()) return;

    this.postService.toggleLike(post.id).subscribe({
      next: (updated) => {
        // Atualizar post na lista
        const currentPosts = this.posts();
        const index = currentPosts.findIndex(p => p.id === post.id);
        if (index !== -1) {
          currentPosts[index] = updated;
          this.posts.set([...currentPosts]);
        }
      }
    });
  }

  onPageChange(page: number): void {
    this.filter.skipCount = (page - 1) * this.filter.maxResultCount;
    this.loadTimeline();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get currentPage(): number {
    return Math.floor(this.filter.skipCount / this.filter.maxResultCount) + 1;
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount() / this.filter.maxResultCount);
  }

  formatDate(date: Date): string {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return postDate.toLocaleDateString('pt-BR');
  }
}
