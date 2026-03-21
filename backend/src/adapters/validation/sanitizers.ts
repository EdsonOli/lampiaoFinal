import sanitizeHtml from 'sanitize-html';
import { ValidationError } from '../../core/errors';

const allowedImageProtocols = new Set(['http:', 'https:']);
const allowedImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];

function validateImageUrl(urlValue: string, allowedHosts?: string[], requireImageExtension = false): string {
  let parsed: URL;

  try {
    parsed = new URL(urlValue);
  } catch {
    throw new ValidationError('Invalid image URL');
  }

  if (!allowedImageProtocols.has(parsed.protocol)) {
    throw new ValidationError('Invalid image URL');
  }

  if (allowedHosts && allowedHosts.length > 0 && !allowedHosts.includes(parsed.hostname)) {
    throw new ValidationError('Invalid image URL');
  }

  const pathname = parsed.pathname.toLowerCase();

  // Google Books and some trusted catalog providers serve covers via dynamic
  // endpoints that do not include file extensions in the path.
  if (requireImageExtension && !allowedImageExtensions.some((extension) => pathname.endsWith(extension))) {
    throw new ValidationError('Invalid image URL');
  }

  return parsed.toString();
}

export function sanitizePlainText(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

export function sanitizeOptionalPlainText(value?: string): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const sanitized = sanitizePlainText(value);
  return sanitized.length > 0 ? sanitized : undefined;
}

export function sanitizeOptionalUrl(value?: string): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const sanitized = value.trim();
  return sanitized.length > 0 ? sanitized : undefined;
}

export function sanitizeBookImageUrl(value?: string): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const sanitized = value.trim();

  if (!sanitized) {
    return undefined;
  }

  return validateImageUrl(sanitized, [
    'books.google.com',
    'books.googleusercontent.com',
    'covers.openlibrary.org',
    'archive.org',
    'images-na.ssl-images-amazon.com',
    'm.media-amazon.com',
  ]);
}

export function sanitizeProfileImageUrl(value?: string): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const sanitized = value.trim();

  if (!sanitized) {
    return undefined;
  }

  return validateImageUrl(sanitized);
}