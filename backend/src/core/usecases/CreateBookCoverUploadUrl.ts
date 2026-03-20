import { randomUUID } from 'node:crypto';
import { ForbiddenError, NotFoundError, ValidationError } from '../errors';
import { ImageStorage, SignedUploadUrl } from '../ports/ImageStorage';
import { BookRepository } from '../ports/BookRepository';

export interface CreateBookCoverUploadUrlInput {
  requesterRole: 'user' | 'admin';
  requesterUserId: string;
  bookId?: string;
  fileName: string;
  mimeType: string;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

function sanitizeFileName(fileName: string): string {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);
}

function inferExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/avif':
      return 'avif';
    default:
      return 'bin';
  }
}

export class CreateBookCoverUploadUrl {
  constructor(
    private readonly imageStorage: ImageStorage,
    private readonly bookRepository: BookRepository,
    private readonly bucketName: string = process.env.SUPABASE_BUCKET_BOOK_COVERS || 'book-covers'
  ) {}

  async execute(input: CreateBookCoverUploadUrlInput): Promise<SignedUploadUrl> {
    if (input.requesterRole !== 'admin') {
      throw new ForbiddenError('Only admins can upload or replace book covers');
    }

    if (!input.requesterUserId) {
      throw new ValidationError('User id is required');
    }

    if (input.bookId) {
      const book = await this.bookRepository.findById(input.bookId);
      if (!book) {
        throw new NotFoundError('Book not found');
      }
    }

    if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
      throw new ValidationError('Unsupported image format. Use JPG, PNG, WEBP or AVIF');
    }

    const safeName = sanitizeFileName(input.fileName || 'cover');
    const extension = inferExtension(input.mimeType);
    const path = input.bookId
      ? `books/${input.bookId}/${randomUUID()}-${safeName || 'cover'}.${extension}`
      : `books/drafts/${input.requesterUserId}/${randomUUID()}-${safeName || 'cover'}.${extension}`;

    return this.imageStorage.createSignedUploadUrl({
      bucket: this.bucketName,
      path,
      mimeType: input.mimeType,
      expiresInSeconds: 120,
    });
  }
}