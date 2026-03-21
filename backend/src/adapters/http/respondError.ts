import { Response } from 'express';
import { ApiErrorCode } from './errorCatalog';

interface ErrorResponseBody {
  message: string;
  code: ApiErrorCode;
  details?: Array<{ field?: string; message: string }>;
  retryAfterSeconds?: number;
}

function sendError(res: Response, statusCode: number, body: ErrorResponseBody): Response {
  return res.status(statusCode).json(body);
}

export function badRequest(res: Response, message: string, code: ApiErrorCode, details?: ErrorResponseBody['details']): Response {
  return sendError(res, 400, { message, code, details });
}

export function unauthorized(res: Response, message: string, code: ApiErrorCode): Response {
  return sendError(res, 401, { message, code });
}

export function forbidden(res: Response, message: string, code: ApiErrorCode): Response {
  return sendError(res, 403, { message, code });
}

export function notFound(res: Response, message: string, code: ApiErrorCode): Response {
  return sendError(res, 404, { message, code });
}

export function conflict(res: Response, message: string, code: ApiErrorCode): Response {
  return sendError(res, 409, { message, code });
}

export function validationError(res: Response, message: string, code: ApiErrorCode, field?: string): Response {
  return sendError(res, 400, {
    message,
    code,
    details: field ? [{ field, message }] : undefined,
  });
}

export function tooManyRequests(
  res: Response,
  message: string,
  code: ApiErrorCode,
  retryAfterSeconds: number
): Response {
  return sendError(res, 429, {
    message,
    code,
    retryAfterSeconds,
  });
}