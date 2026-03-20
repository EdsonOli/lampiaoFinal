import { AppError } from './AppError';

/**
 * Thrown when a resource already exists or violates a unique constraint.
 * Maps to HTTP 409.
 */
export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly message: string;

  constructor(message: string = 'Resource already exists') {
    super(message);
    this.message = message;
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
