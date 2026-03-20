import { ZodError, ZodTypeAny, infer as zInfer } from 'zod';

export function parseOrThrow<T extends ZodTypeAny>(schema: T, payload: unknown): zInfer<T> {
  return schema.parse(payload);
}

export function getValidationMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message || 'Validation failed';
  }

  return 'Validation failed';
}

export function isValidationError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}