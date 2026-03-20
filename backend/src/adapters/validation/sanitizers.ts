import sanitizeHtml from 'sanitize-html';

const allowedImageProtocols = new Set(['http:', 'https:']);
const allowedImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];

function validateImageUrl(urlValue: string, allowedHosts?: string[]): string {
  let parsed: URL;

  try {
    parsed = new URL(urlValue);
  } catch {
    throw new Error('Invalid image URL');
  }

  if (!allowedImageProtocols.has(parsed.protocol)) {
    throw new Error('Invalid image URL');
  }

  if (allowedHosts && allowedHosts.length > 0 && !allowedHosts.includes(parsed.hostname)) {
    throw new Error('Invalid image URL');
  }

  const pathname = parsed.pathname.toLowerCase();

  if (!allowedImageExtensions.some((extension) => pathname.endsWith(extension))) {
    throw new Error('Invalid image URL');
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

  const sanitized = sanitizePlainText(value);
  return sanitized.length > 0 ? sanitized : undefined;
}

export function sanitizeBookImageUrl(value?: string): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const sanitized = sanitizePlainText(value);

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

  const sanitized = sanitizePlainText(value);

  if (!sanitized) {
    return undefined;
  }

  return validateImageUrl(sanitized);
}