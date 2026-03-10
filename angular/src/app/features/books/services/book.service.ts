import { Injectable } from '@angular/core';
import { RestService } from '@abp/ng.core';
import { Observable } from 'rxjs';
import { PagedResponse } from '../../../shared/models/page-request.model';
import { 
  BookDto, 
  CreateUpdateBookDto, 
  GetBooksInput,
  BookStatisticsDto 
} from '../models/book.model';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private apiName = 'Default';
  private baseUrl = '/api/app/book';

  constructor(private restService: RestService) {}

  /**
   * Obtém lista paginada de livros
   */
  getList(input: GetBooksInput = {}): Observable<PagedResponse<BookDto>> {
    return this.restService.request<void, PagedResponse<BookDto>>({
      method: 'GET',
      url: this.baseUrl,
      params: input
    },
    { apiName: this.apiName });
  }

  /**
   * Obtém um livro por ID
   */
  get(id: string): Observable<BookDto> {
    return this.restService.request<void, BookDto>({
      method: 'GET',
      url: `${this.baseUrl}/${id}`
    },
    { apiName: this.apiName });
  }

  /**
   * Cria novo livro (apenas admin)
   */
  create(input: CreateUpdateBookDto): Observable<BookDto> {
    return this.restService.request<CreateUpdateBookDto, BookDto>({
      method: 'POST',
      url: this.baseUrl,
      body: input
    },
    { apiName: this.apiName });
  }

  /**
   * Atualiza livro existente (apenas admin)
   */
  update(id: string, input: CreateUpdateBookDto): Observable<BookDto> {
    return this.restService.request<CreateUpdateBookDto, BookDto>({
      method: 'PUT',
      url: `${this.baseUrl}/${id}`,
      body: input
    },
    { apiName: this.apiName });
  }

  /**
   * Remove livro (apenas admin)
   */
  delete(id: string): Observable<void> {
    return this.restService.request<void, void>({
      method: 'DELETE',
      url: `${this.baseUrl}/${id}`
    },
    { apiName: this.apiName });
  }

  /**
   * Obtém livros mais bem avaliados
   */
  getTopRated(maxCount: number = 10): Observable<BookDto[]> {
    return this.restService.request<void, BookDto[]>({
      method: 'GET',
      url: `${this.baseUrl}/top-rated`,
      params: { maxCount }
    },
    { apiName: this.apiName });
  }

  /**
   * Obtém livros mais favoritados
   */
  getMostFavorited(maxCount: number = 10): Observable<BookDto[]> {
    return this.restService.request<void, BookDto[]>({
      method: 'GET',
      url: `${this.baseUrl}/most-favorited`,
      params: { maxCount }
    },
    { apiName: this.apiName });
  }

  /**
   * Obtém livros adicionados recentemente
   */
  getLatest(maxCount: number = 10): Observable<BookDto[]> {
    return this.restService.request<void, BookDto[]>({
      method: 'GET',
      url: `${this.baseUrl}/latest`,
      params: { maxCount }
    },
    { apiName: this.apiName });
  }

  /**
   * Obtém estatísticas de um livro
   */
  getStatistics(id: string): Observable<BookStatisticsDto> {
    return this.restService.request<void, BookStatisticsDto>({
      method: 'GET',
      url: `${this.baseUrl}/${id}/statistics`
    },
    { apiName: this.apiName });
  }

  /**
   * Busca livros por texto
   */
  search(query: string, maxCount: number = 20): Observable<BookDto[]> {
    return this.restService.request<void, BookDto[]>({
      method: 'GET',
      url: `${this.baseUrl}/search`,
      params: { query, maxCount }
    },
    { apiName: this.apiName });
  }
}
