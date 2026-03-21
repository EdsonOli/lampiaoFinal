import { HttpErrorResponse } from '@angular/common/http';
import { FrontendErrorCode, isFrontendErrorCode } from './error-catalog';

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorPayload {
  message: string;
  code?: FrontendErrorCode;
  details?: ApiErrorDetail[];
  retryAfterSeconds?: number;
  requestId?: string;
  timestamp?: string;
  path?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function getNestedError(raw: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!raw || !isRecord(raw['error'])) {
    return undefined;
  }

  return raw['error'];
}

function getMessage(
  error: HttpErrorResponse,
  raw: Record<string, unknown> | undefined,
  nestedError: Record<string, unknown> | undefined
): string {
  if (typeof raw?.['message'] === 'string') {
    return raw['message'];
  }

  if (typeof raw?.['error'] === 'string') {
    return raw['error'];
  }

  if (typeof nestedError?.['message'] === 'string') {
    return nestedError['message'];
  }

  return error.message || 'Ocorreu um erro inesperado.';
}

function getCode(raw: Record<string, unknown> | undefined, nestedError: Record<string, unknown> | undefined): FrontendErrorCode | undefined {
  if (typeof raw?.['code'] === 'string' && isFrontendErrorCode(raw['code'])) {
    return raw['code'];
  }

  if (typeof nestedError?.['code'] === 'string' && isFrontendErrorCode(nestedError['code'])) {
    return nestedError['code'];
  }

  return undefined;
}

function getRetryAfterSeconds(raw: Record<string, unknown> | undefined): number | undefined {
  const value = raw?.['retryAfterSeconds'];
  if (typeof value === 'number' && value > 0) {
    return value;
  }
  return undefined;
}

function getDetails(raw: Record<string, unknown> | undefined): ApiErrorDetail[] | undefined {
  if (!Array.isArray(raw?.['details'])) {
    return undefined;
  }

  return raw['details']
    .filter((item): item is Record<string, unknown> => isRecord(item) && typeof item['message'] === 'string')
    .map((item) => ({
      field: typeof item['field'] === 'string' ? item['field'] : undefined,
      message: item['message'] as string,
    }));
}

export function normalizeApiErrorPayload(error: unknown): ApiErrorPayload {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Não foi possível se comunicar com o Lampião. Verifique sua conexão e tente novamente.',
      };
    }

    const raw = isRecord(error.error) ? error.error : undefined;
    const nestedError = getNestedError(raw);

    const code = getCode(raw, nestedError);
    const retryAfterSeconds = getRetryAfterSeconds(raw);

    return {
      message: getMessage(error, raw, nestedError),
      code,
      details: getDetails(raw),
      retryAfterSeconds,
      requestId: typeof raw?.['requestId'] === 'string' ? raw['requestId'] : undefined,
      timestamp: typeof raw?.['timestamp'] === 'string' ? raw['timestamp'] : undefined,
      path: typeof raw?.['path'] === 'string' ? raw['path'] : undefined,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || 'Ocorreu um erro inesperado.',
    };
  }

  return {
    message: 'Ocorreu um erro inesperado.',
  };
}