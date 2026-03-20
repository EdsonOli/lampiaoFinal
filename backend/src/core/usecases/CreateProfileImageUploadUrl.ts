import { randomUUID } from 'node:crypto';
import { ValidationError } from '../errors';
import { ImageStorage, SignedUploadUrl } from '../ports/ImageStorage';

export interface CreateProfileImageUploadUrlInput {
  userId: string;
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

export class CreateProfileImageUploadUrl {
  constructor(
    private readonly imageStorage: ImageStorage,
    private readonly bucketName: string = process.env.SUPABASE_BUCKET_PROFILE_IMAGES || 'profile-images'
  ) {}

  async execute(input: CreateProfileImageUploadUrlInput): Promise<SignedUploadUrl> {
    if (!input.userId) {
      throw new ValidationError('User id is required');
    }

    if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
      throw new ValidationError('Unsupported image format. Use JPG, PNG, WEBP or AVIF');
    }

    const safeName = sanitizeFileName(input.fileName || 'avatar');
    const extension = inferExtension(input.mimeType);
    const path = `users/${input.userId}/${randomUUID()}-${safeName || 'avatar'}.${extension}`;

    return this.imageStorage.createSignedUploadUrl({
      bucket: this.bucketName,
      path,
      mimeType: input.mimeType,
      expiresInSeconds: 120,
    });
  }
}