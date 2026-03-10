import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PostService } from '../../services/post.service';
import { CommentService } from '../../services/comment.service';
import { PostDto } from '../../models/post.model';
import { CommentDto } from '../../models/post.model';
import { ConfigStateService } from '@abp/ng.core';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.scss'
})
export class PostDetailComponent implements OnInit {
  post = signal<PostDto | null>(null);
  comments = signal<CommentDto[]>([]);
  loading = signal(false);
  loadingComments = signal(false);
  isAuthenticated = signal(false);
  
  commentForm: FormGroup;
  replyingTo = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private postService: PostService,
    private commentService: CommentService,
    private fb: FormBuilder,
    private configState: ConfigStateService
  ) {
    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.isAuthenticated.set(this.configState.getOne('currentUser')?.isAuthenticated ?? false);
    
    const postId = this.route.snapshot.paramMap.get('id');
    if (postId) {
      this.loadPost(postId);
      this.loadComments(postId);
    }
  }

  loadPost(id: string): void {
    this.loading.set(true);
    
    this.postService.get(id).subscribe({
      next: (post) => {
        this.post.set(post);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadComments(postId: string): void {
    this.loadingComments.set(true);
    
    this.commentService.getByPost({ postId }).subscribe({
      next: (comments) => {
        this.comments.set(comments);
        this.loadingComments.set(false);
      },
      error: () => {
        this.loadingComments.set(false);
      }
    });
  }

  toggleLike(): void {
    const post = this.post();
    if (!post || !this.isAuthenticated()) return;

    this.postService.toggleLike(post.id).subscribe({
      next: (updated) => {
        this.post.set(updated);
      }
    });
  }

  submitComment(): void {
    if (!this.commentForm.valid || !this.post()) return;

    const postId = this.post()!.id;
    const parentId = this.replyingTo();
    
    const dto = {
      postId,
      content: this.commentForm.value.content,
      parentCommentId: parentId
    };

    this.commentService.create(dto).subscribe({
      next: () => {
        this.commentForm.reset();
        this.replyingTo.set(null);
        this.loadComments(postId);
      }
    });
  }

  replyToComment(commentId: string): void {
    this.replyingTo.set(commentId);
    this.commentForm.patchValue({ content: '' });
  }

  cancelReply(): void {
    this.replyingTo.set(null);
    this.commentForm.reset();
  }

  deleteComment(commentId: string): void {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) return;

    this.commentService.delete(commentId).subscribe({
      next: () => {
        this.loadComments(this.post()!.id);
      }
    });
  }

  getTopLevelComments(): CommentDto[] {
    return this.comments().filter(c => !c.parentCommentId);
  }

  getReplies(commentId: string): CommentDto[] {
    return this.comments().filter(c => c.parentCommentId === commentId);
  }

  formatDate(date: Date): string {
    const now = new Date();
    const commentDate = new Date(date);
    const diffMs = now.getTime() - commentDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return commentDate.toLocaleDateString('pt-BR');
  }
}
