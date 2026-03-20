import { AppError } from './AppError';

/**
 * Thrown when a requested resource is not found.
 * Maps to HTTP 404.
 */
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly message: string;

  constructor(message: string = 'Not found') {
    super(message);
    this.message = message;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
