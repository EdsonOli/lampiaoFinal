import { Injectable } from '@angular/core';
import { RestService } from '@abp/ng.core';
import { Observable } from 'rxjs';
import { PagedResponse } from '../../../shared/models/page-request.model';
import {
  UserBookDto,
  AddToLibraryDto,
  UpdateUserBookDto,
  LibraryStatisticsDto,
  GetUserBooksInput,
  ReadingStatus
} from '../models/user-book.model';

@Injectable({
  providedIn: 'root'
})
export class UserBookService {
  private apiName = 'Default';
  private baseUrl = '/api/app/user-book';

  constructor(private restService: RestService) {}

  /**
   * Obtém biblioteca do usuário logado
   */
  getMyLibrary(input: GetUserBooksInput = {}): Observable<PagedResponse<UserBookDto>> {
    return this.restService.request<void, PagedResponse<UserBookDto>>({
      method: 'GET',
      url: `${this.baseUrl}/my-library`,
      params: input
    },
    { apiName: this.apiName });
  }

  /**
   * Obtém biblioteca de um usuário específico
   */
  getUserLibrary(userId: string, input: GetUserBooksInput = {}): Observable<PagedResponse<UserBookDto>> {
    return this.restService.request<void, PagedResponse<UserBookDto>>({
      method: 'GET',
      url: `${this.baseUrl}/user/${userId}`,
      params: input
    },
    { apiName: this.apiName });
  }

  /**
   * Adiciona livro à biblioteca
   */
  addToLibrary(input: AddToLibraryDto): Observable<UserBookDto> {
    return this.restService.request<AddToLibraryDto, UserBookDto>({
      method: 'POST',
      url: this.baseUrl,
      body: input
    },
    { apiName: this.apiName });
  }

  /**
   * Atualiza informações do livro na biblioteca
   */
  update(id: string, input: UpdateUserBookDto): Observable<UserBookDto> {
    return this.restService.request<UpdateUserBookDto, UserBookDto>({
      method: 'PUT',
      url: `${this.baseUrl}/${id}`,
      body: input
    },
    { apiName: this.apiName });
  }

  /**
   * Remove livro da biblioteca
   */
  removeFromLibrary(id: string): Observable<void> {
    return this.restService.request<void, void>({
      method: 'DELETE',
      url: `${this.baseUrl}/${id}`
    },
    { apiName: this.apiName });
  }

  /**
   * Atualiza status de leitura
   */
  updateReadingStatus(id: string, status: ReadingStatus): Observable<UserBookDto> {
    return this.restService.request<{ status: ReadingStatus }, UserBookDto>({
      method: 'PUT',
      url: `${this.baseUrl}/${id}/reading-status`,
      body: { status }
    },
    { apiName: this.apiName });
  }

  /**
   * Avalia um livro (1-5 estrelas)
   */
  rateBook(id: string, rating: number): Observable<UserBookDto> {
    return this.restService.request<{ rating: number }, UserBookDto>({
      method: 'PUT',
      url: `${this.baseUrl}/${id}/rate`,
      body: { rating }
    },
    { apiName: this.apiName });
  }

  /**
   * Marca/desmarca livro como favorito
   */
  toggleFavorite(id: string): Observable<UserBookDto> {
    return this.restService.request<void, UserBookDto>({
      method: 'PUT',
      url: `${this.baseUrl}/${id}/toggle-favorite`
    },
    { apiName: this.apiName });
  }

  /**
   * Obtém estatísticas da biblioteca do usuário
   */
  getMyStatistics(): Observable<LibraryStatisticsDto> {
    return this.restService.request<void, LibraryStatisticsDto>({
      method: 'GET',
      url: `${this.baseUrl}/my-statistics`
    },
    { apiName: this.apiName });
  }

  /**
   * Verifica se um livro está na biblioteca do usuário
   */
  checkInLibrary(bookId: string): Observable<UserBookDto | null> {
    return this.restService.request<void, UserBookDto | null>({
      method: 'GET',
      url: `${this.baseUrl}/check/${bookId}`
    },
    { apiName: this.apiName });
  }
}
