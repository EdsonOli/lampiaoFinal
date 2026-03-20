import { AppError } from './AppError';

/**
 * Thrown when a Google identity does not match an existing linked account.
 * Maps to HTTP 403.
 */
export class GoogleAccountLinkConflictError extends AppError {
  readonly statusCode = 403;
  readonly code = 'GOOGLE_LINK_CONFLICT';
  readonly message: string;

  constructor(message: string = 'Google account does not match existing linked account') {
    super(message);
    this.message = message;
    Object.setPrototypeOf(this, GoogleAccountLinkConflictError.prototype);
  }
}
