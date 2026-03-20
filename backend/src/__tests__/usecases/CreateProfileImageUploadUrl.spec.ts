import { ValidationError } from '../../core/errors';
import { ImageStorage } from '../../core/ports/ImageStorage';
import { CreateProfileImageUploadUrl } from '../../core/usecases/CreateProfileImageUploadUrl';

class FakeImageStorage implements ImageStorage {
  async createSignedUploadUrl(input: {
    bucket: string;
    path: string;
    mimeType: string;
    expiresInSeconds: number;
  }): Promise<{ uploadUrl: string; publicUrl: string; path: string }> {
    return {
      uploadUrl: `https://upload.example.com/${input.path}`,
      publicUrl: `https://public.example.com/${input.path}`,
      path: input.path,
    };
  }
}

describe('CreateProfileImageUploadUrl', () => {
  it('creates signed upload URL for supported mime type', async () => {
    const sut = new CreateProfileImageUploadUrl(new FakeImageStorage(), 'profile-images');

    const result = await sut.execute({
      userId: '4e03d64a-ef83-4f64-bf0a-30454de39df9',
      fileName: 'Minha Foto.png',
      mimeType: 'image/png',
    });

    expect(result.uploadUrl).toContain('https://upload.example.com/');
    expect(result.publicUrl).toContain('https://public.example.com/');
    expect(result.path).toContain('users/4e03d64a-ef83-4f64-bf0a-30454de39df9/');
    expect(result.path.endsWith('.png')).toBe(true);
  });

  it('throws validation error for unsupported mime type', async () => {
    const sut = new CreateProfileImageUploadUrl(new FakeImageStorage(), 'profile-images');

    await expect(
      sut.execute({
        userId: '4e03d64a-ef83-4f64-bf0a-30454de39df9',
        fileName: 'arquivo.txt',
        mimeType: 'text/plain',
      })
    ).rejects.toThrow(ValidationError);
  });
});
