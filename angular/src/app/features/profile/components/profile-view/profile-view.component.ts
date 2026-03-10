import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { UserBookService } from '../../../library/services/user-book.service';
import { PostService } from '../../../social/services/post.service';
import { LibraryStatisticsDto } from '../../../library/models/user-book.model';
import { UserProfileDto, UserStatisticsDto } from '../../models/profile.model';
import { PostDto } from '../../../social/models/post.model';
import { UserBookDto } from '../../../library/models/user-book.model';
import { ConfigStateService } from '@abp/ng.core';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile-view.component.html',
  styleUrl: './profile-view.component.scss'
})
export class ProfileViewComponent implements OnInit {
  profile = signal<UserProfileDto | null>(null);
  libraryStats = signal<LibraryStatisticsDto | null>(null);
  recentPosts = signal<PostDto[]>([]);
  recentBooks = signal<UserBookDto[]>([]);
  
  loading = signal(false);
  isOwnProfile = signal(false);
  userId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private userBookService: UserBookService,
    private postService: PostService,
    private configState: ConfigStateService
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    const currentUserId = this.configState.getOne('currentUser')?.id;
    
    // Se não há ID na rota ou é o ID do usuário atual, mostra perfil próprio
    if (!this.userId || this.userId === currentUserId) {
      this.isOwnProfile.set(true);
      this.userId = currentUserId;
    }

    if (this.userId) {
      this.loadProfile();
    }
  }

  loadProfile(): void {
    this.loading.set(true);

    // Carregar estatísticas da biblioteca
    if (this.isOwnProfile()) {
      this.userBookService.getMyStatistics().subscribe({
        next: (stats) => {
          this.libraryStats.set(stats);
        }
      });

      this.userBookService.getMyLibrary({
        skipCount: 0,
        maxResultCount: 4,
        sorting: 'creationTime desc'
      }).subscribe({
        next: (response) => {
          this.recentBooks.set(response.items);
        }
      });
    } else if (this.userId) {
      this.userBookService.getUserLibrary(this.userId, {
        skipCount: 0,
        maxResultCount: 4,
        sorting: 'creationTime desc'
      }).subscribe({
        next: (response) => {
          this.recentBooks.set(response.items);
        }
      });
    }

    // Carregar posts recentes
    const postsRequest$ = this.isOwnProfile()
      ? this.postService.getMyPosts({ skipCount: 0, maxResultCount: 3 })
      : this.postService.getUserPosts(this.userId!, { skipCount: 0, maxResultCount: 3 });

    postsRequest$.subscribe({
      next: (response) => {
        this.recentPosts.set(response.items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  get readingProgress(): number {
    const stats = this.libraryStats();
    if (!stats || stats.totalBooks === 0) return 0;
    return Math.round((stats.booksRead / stats.totalBooks) * 100);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }
}
