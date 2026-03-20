import { GoogleAccountLinkConflictError, GoogleEmailNotVerifiedError } from '../../core/errors';
import { GoogleIdTokenVerifier } from '../../core/ports/GoogleIdTokenVerifier';
import { AuthenticateWithGoogle } from '../../core/usecases/AuthenticateWithGoogle';
import { InMemoryUserRepository } from '../fakes/InMemoryUserRepository';

class FakeGoogleIdTokenVerifier implements GoogleIdTokenVerifier {
  async verify(): Promise<{
    providerUserId: string;
    email: string;
    emailVerified: boolean;
    name?: string;
    picture?: string;
  }> {
    return {
      providerUserId: 'google-123',
      email: 'reader@example.com',
      emailVerified: true,
      name: 'Reader Name',
      picture: 'https://example.com/avatar.png',
    };
  }
}

describe('AuthenticateWithGoogle', () => {
  let userRepo: InMemoryUserRepository;
  let verifier: FakeGoogleIdTokenVerifier;
  let sut: AuthenticateWithGoogle;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    verifier = new FakeGoogleIdTokenVerifier();
    sut = new AuthenticateWithGoogle(userRepo, verifier);
  });

  it('returns existing user when email already exists', async () => {
    const existing = await userRepo.create({
      name: 'Existing Reader',
      email: 'reader@example.com',
      nickname: 'reader',
      password: 'hashed:123',
      authProvider: 'local',
      emailVerified: true,
    });

    const result = await sut.execute({ idToken: 'valid-token' });

    expect(result.id).toBe(existing.id);
    expect(result.email).toBe('reader@example.com');
  });

  it('creates a new google user when email is unknown', async () => {
    const result = await sut.execute({ idToken: 'valid-token' });

    expect(result.id).toEqual(expect.any(String));
    expect(result.email).toBe('reader@example.com');
    expect(result.password).toBeUndefined();
    expect(result.authProvider).toBe('google');
    expect(result.providerId).toBe('google-123');
  });

  it('throws validation error when email is not verified', async () => {
    jest.spyOn(verifier, 'verify').mockResolvedValueOnce({
      providerUserId: 'google-456',
      email: 'reader2@example.com',
      emailVerified: false,
      name: 'Reader 2',
    });

    const resultPromise = sut.execute({ idToken: 'valid-token' });
    await expect(resultPromise).rejects.toThrow(GoogleEmailNotVerifiedError);
    await expect(resultPromise).rejects.toThrow('Google account email is not verified');
  });

  it('throws forbidden error when provider id mismatches an existing google account', async () => {
    await userRepo.create({
      name: 'Google Reader',
      email: 'reader@example.com',
      nickname: 'reader-google',
      password: undefined,
      authProvider: 'google',
      providerId: 'google-999',
      emailVerified: true,
    });

    const resultPromise = sut.execute({ idToken: 'valid-token' });
    await expect(resultPromise).rejects.toThrow(GoogleAccountLinkConflictError);
    await expect(resultPromise).rejects.toThrow('Google account does not match existing linked account');
  });
});
