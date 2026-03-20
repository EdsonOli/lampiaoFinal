import { AppError } from './AppError';

/**
 * Thrown when the Google account email does not match the authenticated user email.
 * Maps to HTTP 403.
 */
export class GoogleLinkEmailMismatchError extends AppError {
  readonly statusCode = 403;
  readonly code = 'GOOGLE_LINK_EMAIL_MISMATCH';
  readonly message: string;

  constructor(message: string = 'Google account email must match your current account email') {
    super(message);
    this.message = message;
    Object.setPrototypeOf(this, GoogleLinkEmailMismatchError.prototype);
  }
}