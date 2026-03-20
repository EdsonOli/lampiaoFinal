/**
 * Base class for domain errors.
 * Provides type-safe error handling with HTTP status codes.
 */
export abstract class AppError extends Error {
  abstract statusCode: number;
  abstract readonly message: string;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
