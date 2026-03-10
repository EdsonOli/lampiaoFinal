/**
 * Modelo base para requisições paginadas seguindo o padrão ABP
 */
export interface PagedRequest {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
}
