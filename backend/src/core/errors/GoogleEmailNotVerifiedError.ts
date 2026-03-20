import { AppError } from './AppError';

/**
 * Thrown when Google account email is not verified.
 * Maps to HTTP 400.
 */
export class GoogleEmailNotVerifiedError extends AppError {
  readonly statusCode = 400;
  readonly code = 'GOOGLE_EMAIL_NOT_VERIFIED';
  readonly message: string;

  constructor(message: string = 'Google account email is not verified') {
    super(message);
    this.message = message;
    Object.setPrototypeOf(this, GoogleEmailNotVerifiedError.prototype);
  }
}
