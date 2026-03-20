export interface CreateSignedUploadUrlInput {
  bucket: string;
  path: string;
  mimeType: string;
  expiresInSeconds: number;
}

export interface SignedUploadUrl {
  uploadUrl: string;
  publicUrl: string;
  path: string;
}

export interface ImageStorage {
  createSignedUploadUrl(input: CreateSignedUploadUrlInput): Promise<SignedUploadUrl>;
}