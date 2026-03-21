import { Request } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../core/errors';
import { ApiErrorCode, isApiErrorCode } from './errorCatalog';

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorPayload {
  message: string;
  code: ApiErrorCode;
  details?: ApiErrorDetail[];
  retryAfterSeconds?: number;
  requestId?: string;
  timestamp: string;
  path: string;
}

export interface NormalizedApiError {
  statusCode: number;
  message: string;
  code: ApiErrorCode;
  details?: ApiErrorDetail[];
  logMessage: string;
}

type GenericError = Error & {
  name?: string;
  status?: number;
  statusCode?: number;
  type?: string;
  errors?: Array<{ message?: string; path?: string[] | string }>;
};

function defaultCodeForStatus(statusCode: number): ApiErrorCode {
  if (statusCode === 400) return 'BAD_REQUEST';
  if (statusCode === 401) return 'UNAUTHORIZED';
  if (statusCode === 403) return 'FORBIDDEN';
  if (statusCode === 404) return 'NOT_FOUND';
  if (statusCode === 409) return 'CONFLICT';
  if (statusCode === 413) return 'PAYLOAD_TOO_LARGE';
  if (statusCode === 429) return 'RATE_LIMITED';
  return 'INTERNAL_SERVER_ERROR';
}

function defaultMessageForStatus(statusCode: number): string {
  if (statusCode === 400) return 'Nao foi possivel processar os dados informados.';
  if (statusCode === 401) return 'Sua sessao nao e valida para esta operacao.';
  if (statusCode === 403) return 'Voce nao tem permissao para executar esta operacao.';
  if (statusCode === 404) return 'O recurso solicitado nao foi encontrado.';
  if (statusCode === 409) return 'Nao foi possivel concluir a operacao por conflito de dados.';
  if (statusCode === 413) return 'O corpo da requisicao excede o limite permitido.';
  if (statusCode === 429) return 'Muitas tentativas em pouco tempo. Tente novamente em instantes.';
  return 'Ocorreu um erro interno inesperado. Tente novamente em instantes.';
}

function isPayloadTooLargeError(error: GenericError): boolean {
  return error.status === 413 || error.statusCode === 413 || error.type === 'entity.too.large';
}

function normalizeZodError(error: ZodError): NormalizedApiError {
  const details = error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : undefined,
    message: issue.message,
  }));

  return {
    statusCode: 400,
    message: details[0]?.message || defaultMessageForStatus(400),
    code: 'VALIDATION_ERROR',
    details,
    logMessage: 'Validation failed while parsing request input',
  };
}

function normalizeSequelizeError(error: GenericError): NormalizedApiError | null {
  if (error.name === 'SequelizeUniqueConstraintError') {
    return {
      statusCode: 409,
      message: error.message || defaultMessageForStatus(409),
      code: 'CONFLICT',
      logMessage: 'Unique constraint violation',
    };
  }

  if (error.name === 'SequelizeValidationError') {
    const details = (error.errors || []).map((item) => ({
      field: Array.isArray(item.path) ? item.path.join('.') : item.path,
      message: item.message || defaultMessageForStatus(400),
    }));

    return {
      statusCode: 400,
      message: details[0]?.message || error.message || defaultMessageForStatus(400),
      code: 'VALIDATION_ERROR',
      details,
      logMessage: 'Persistence validation failed',
    };
  }

  return null;
}

export function normalizeThrownError(error: unknown): NormalizedApiError {
  const genericError = error as GenericError;

  if (isPayloadTooLargeError(genericError)) {
    return {
      statusCode: 413,
      message: defaultMessageForStatus(413),
      code: defaultCodeForStatus(413),
      logMessage: 'Payload exceeded configured body size limit',
    };
  }

  if (error instanceof ZodError) {
    return normalizeZodError(error);
  }

  const sequelizeError = normalizeSequelizeError(genericError);
  if (sequelizeError) {
    return sequelizeError;
  }

  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      message: error.message || defaultMessageForStatus(error.statusCode),
      code: error.code && isApiErrorCode(error.code) ? error.code : defaultCodeForStatus(error.statusCode),
      logMessage: error.message || 'Application error',
    };
  }

  return {
    statusCode: 500,
    message: defaultMessageForStatus(500),
    code: defaultCodeForStatus(500),
    logMessage: genericError?.message || 'Unexpected unhandled error',
  };
}

function extractLegacyMessage(body: unknown, statusCode: number): string {
  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (body && typeof body === 'object') {
    const payload = body as Record<string, unknown>;
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }
  }

  return defaultMessageForStatus(statusCode);
}

function extractLegacyCode(body: unknown, statusCode: number): ApiErrorCode {
  if (body && typeof body === 'object') {
    const payload = body as Record<string, unknown>;
    if (typeof payload.code === 'string' && payload.code.trim() && isApiErrorCode(payload.code)) {
      return payload.code;
    }
  }

  return defaultCodeForStatus(statusCode);
}

function extractLegacyDetails(body: unknown): ApiErrorDetail[] | undefined {
  if (!body || typeof body !== 'object') {
    return undefined;
  }

  const payload = body as Record<string, unknown>;
  if (!Array.isArray(payload.details)) {
    return undefined;
  }

  return payload.details
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      field: typeof item.field === 'string' ? item.field : undefined,
      message: typeof item.message === 'string' ? item.message : defaultMessageForStatus(400),
    }));
}

export function buildApiErrorPayload(req: Request, statusCode: number, body: unknown): ApiErrorPayload {
  if (body && typeof body === 'object') {
    const payload = body as Record<string, unknown>;
    if (
      typeof payload.message === 'string'
      && typeof payload.code === 'string'
      && isApiErrorCode(payload.code)
      && typeof payload.timestamp === 'string'
      && typeof payload.path === 'string'
    ) {
      return {
        message: payload.message,
        code: payload.code,
        details: extractLegacyDetails(payload),
        retryAfterSeconds: typeof payload.retryAfterSeconds === 'number' ? payload.retryAfterSeconds : undefined,
        requestId: typeof payload.requestId === 'string' ? payload.requestId : req.requestId,
        timestamp: payload.timestamp,
        path: payload.path,
      };
    }
  }

  return {
    message: extractLegacyMessage(body, statusCode),
    code: extractLegacyCode(body, statusCode),
    details: extractLegacyDetails(body),
    retryAfterSeconds: body && typeof body === 'object' && typeof (body as Record<string, unknown>).retryAfterSeconds === 'number'
      ? (body as Record<string, unknown>).retryAfterSeconds as number
      : undefined,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };
}