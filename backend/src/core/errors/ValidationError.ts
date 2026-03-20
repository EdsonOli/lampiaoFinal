import { AppError } from './AppError';

/**
 * Thrown when request input validation fails.
 * Maps to HTTP 400.
 */
export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly message: string;

  constructor(message: string = 'Validation failed') {
    super(message);
    this.message = message;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
