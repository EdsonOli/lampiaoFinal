import { AppError } from './AppError';

/**
 * Thrown when a user lacks permission to access a resource.
 * Maps to HTTP 403.
 */
export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly message: string;

  constructor(message: string = 'Forbidden') {
    super(message);
    this.message = message;
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
