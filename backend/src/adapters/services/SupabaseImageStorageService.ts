import { createClient } from '@supabase/supabase-js';
import { ValidationError } from '../../core/errors';
import { CreateSignedUploadUrlInput, ImageStorage, SignedUploadUrl } from '../../core/ports/ImageStorage';

type SupabaseBucketClient = {
  createSignedUploadUrl: (
    path: string,
    options?: { upsert: boolean }
  ) => Promise<{ data: { signedUrl: string; token?: string; path?: string } | null; error: { message: string } | null }>;
  getPublicUrl: (path: string) => { data: { publicUrl: string } };
};

type SupabaseStorageClient = {
  from: (bucket: string) => SupabaseBucketClient;
};

type MinimalSupabaseClient = {
  storage: SupabaseStorageClient;
};

export class SupabaseImageStorageService implements ImageStorage {
  private readonly client: MinimalSupabaseClient | null;

  constructor(client?: MinimalSupabaseClient) {
    if (client) {
      this.client = client;
      return;
    }

    const url = process.env.SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!url || !serviceRoleKey) {
      this.client = null;
      return;
    }

    this.client = createClient(url, serviceRoleKey) as unknown as MinimalSupabaseClient;
  }

  async createSignedUploadUrl(input: CreateSignedUploadUrlInput): Promise<SignedUploadUrl> {
    if (!this.client) {
      throw new ValidationError('Supabase storage is not configured');
    }

    const bucket = this.client.storage.from(input.bucket);
    const { data, error } = await bucket.createSignedUploadUrl(
      input.path,
      {
        upsert: true,
      }
    );

    if (error || !data?.signedUrl) {
      throw new ValidationError(error?.message || 'Could not create signed upload URL');
    }

    const publicUrl = bucket.getPublicUrl(input.path).data.publicUrl;

    return {
      uploadUrl: data.signedUrl,
      publicUrl,
      path: input.path,
    };
  }
}