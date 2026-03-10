import { Injectable } from '@angular/core';
import { RestService } from '@abp/ng.core';
import { Observable } from 'rxjs';
import { PagedResponse } from '../../../shared/models/page-request.model';
import {
  CommentDto,
  CreateCommentDto,
  UpdateCommentDto,
  GetCommentsInput
} from '../models/post.model';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiName = 'Default';
  private baseUrl = '/api/app/comment';

  constructor(private restService: RestService) {}

  /**
   * Obtém comentários de um post
   */
  getByPost(input: GetCommentsInput): Observable<PagedResponse<CommentDto>> {
    return this.restService.request<void, PagedResponse<CommentDto>>({
      method: 'GET',
      url: `${this.baseUrl}/by-post`,
      params: input
    },
    { apiName: this.apiName });
  }

  /**
   * Obtém respostas de um comentário
   */
  getReplies(commentId: string): Observable<CommentDto[]> {
    return this.restService.request<void, CommentDto[]>({
      method: 'GET',
      url: `${this.baseUrl}/${commentId}/replies`
    },
    { apiName: this.apiName });
  }

  /**
   * Cria novo comentário
   */
  create(input: CreateCommentDto): Observable<CommentDto> {
    return this.restService.request<CreateCommentDto, CommentDto>({
      method: 'POST',
      url: this.baseUrl,
      body: input
    },
    { apiName: this.apiName });
  }

  /**
   * Atualiza comentário
   */
  update(id: string, input: UpdateCommentDto): Observable<CommentDto> {
    return this.restService.request<UpdateCommentDto, CommentDto>({
      method: 'PUT',
      url: `${this.baseUrl}/${id}`,
      body: input
    },
    { apiName: this.apiName });
  }

  /**
   * Remove comentário
   */
  delete(id: string): Observable<void> {
    return this.restService.request<void, void>({
      method: 'DELETE',
      url: `${this.baseUrl}/${id}`
    },
    { apiName: this.apiName });
  }
}
