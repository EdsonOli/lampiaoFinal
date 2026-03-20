import { AppError } from './AppError';

/**
 * Thrown when a Google identity is already linked to another account.
 * Maps to HTTP 409.
 */
export class GoogleProviderAlreadyLinkedError extends AppError {
  readonly statusCode = 409;
  readonly code = 'GOOGLE_PROVIDER_ALREADY_LINKED';
  readonly message: string;

  constructor(message: string = 'This Google account is already linked to another Lampiao account') {
    super(message);
    this.message = message;
    Object.setPrototypeOf(this, GoogleProviderAlreadyLinkedError.prototype);
  }
}