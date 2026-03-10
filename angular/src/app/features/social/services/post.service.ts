import { Injectable } from '@angular/core';
import { RestService } from '@abp/ng.core';
import { Observable } from 'rxjs';
import { PagedResponse } from '../../../shared/models/page-request.model';
import {
  PostDto,
  CreatePostDto,
  UpdatePostDto,
  GetPostsInput,
  CommentDto,
  CreateCommentDto,
  UpdateCommentDto,
  GetCommentsInput
} from '../models/post.model';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private apiName = 'Default';
  private baseUrl = '/api/app/post';

  constructor(private restService: RestService) {}

  /**
   * Obtém timeline (feed) de posts
   */
  getTimeline(input: GetPostsInput = {}): Observable<PagedResponse<PostDto>> {
    return this.restService.request<void, PagedResponse<PostDto>>({
      method: 'GET',
      url: `${this.baseUrl}/timeline`,
      params: input
    },
    { apiName: this.apiName });
  }

  /**
   * Obtém posts do usuário logado
   */
  getMyPosts(input: GetPostsInput = {}): Observable<PagedResponse<PostDto>> {
    return this.restService.request<void, PagedResponse<PostDto>>({
      method: 'GET',
      url: `${this.baseUrl}/my-posts`,
      params: input
    },
    { apiName: this.apiName });
  }

  /**
   * Obtém posts de um usuário específico
   */
  getUserPosts(userId: string, input: GetPostsInput = {}): Observable<PagedResponse<PostDto>> {
    return this.restService.request<void, PagedResponse<PostDto>>({
      method: 'GET',
      url: `${this.baseUrl}/user/${userId}`,
      params: input
    },
    { apiName: this.apiName });
  }

  /**
   * Obtém posts sobre um livro específico
   */
  getBookPosts(bookId: string, input: GetPostsInput = {}): Observable<PagedResponse<PostDto>> {
    return this.restService.request<void, PagedResponse<PostDto>>({
      method: 'GET',
      url: `${this.baseUrl}/book/${bookId}`,
      params: input
    },
    { apiName: this.apiName });
  }

  /**
   * Obtém um post por ID
   */
  get(id: string): Observable<PostDto> {
    return this.restService.request<void, PostDto>({
      method: 'GET',
      url: `${this.baseUrl}/${id}`
    },
    { apiName: this.apiName });
  }

  /**
   * Cria novo post
   */
  create(input: CreatePostDto): Observable<PostDto> {
    return this.restService.request<CreatePostDto, PostDto>({
      method: 'POST',
      url: this.baseUrl,
      body: input
    },
    { apiName: this.apiName });
  }

  /**
   * Atualiza post existente
   */
  update(id: string, input: UpdatePostDto): Observable<PostDto> {
    return this.restService.request<UpdatePostDto, PostDto>({
      method: 'PUT',
      url: `${this.baseUrl}/${id}`,
      body: input
    },
    { apiName: this.apiName });
  }

  /**
   * Remove post
   */
  delete(id: string): Observable<void> {
    return this.restService.request<void, void>({
      method: 'DELETE',
      url: `${this.baseUrl}/${id}`
    },
    { apiName: this.apiName });
  }

  /**
   * Curtir/descurtir post
   */
  toggleLike(id: string): Observable<PostDto> {
    return this.restService.request<void, PostDto>({
      method: 'PUT',
      url: `${this.baseUrl}/${id}/toggle-like`
    },
    { apiName: this.apiName });
  }
}
