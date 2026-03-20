import {
  GoogleAccountLinkConflictError,
  GoogleEmailNotVerifiedError,
  GoogleLinkEmailMismatchError,
  GoogleProviderAlreadyLinkedError,
} from '../../core/errors';
import { GoogleIdTokenVerifier } from '../../core/ports/GoogleIdTokenVerifier';
import { LinkGoogleAccount } from '../../core/usecases/LinkGoogleAccount';
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

describe('LinkGoogleAccount', () => {
  let userRepo: InMemoryUserRepository;
  let verifier: FakeGoogleIdTokenVerifier;
  let sut: LinkGoogleAccount;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    verifier = new FakeGoogleIdTokenVerifier();
    sut = new LinkGoogleAccount(userRepo, verifier);
  });

  it('links a local user account with google provider id', async () => {
    const user = await userRepo.create({
      name: 'Local Reader',
      email: 'reader@example.com',
      nickname: 'reader',
      password: 'hashed:local',
      authProvider: 'local',
      emailVerified: true,
    });

    const result = await sut.execute({ userId: user.id, idToken: 'valid-token' });

    expect(result.authProvider).toBe('google');
    expect(result.providerId).toBe('google-123');
    expect(result.email).toBe('reader@example.com');
  });

  it('throws when google email is not verified', async () => {
    const user = await userRepo.create({
      name: 'Local Reader',
      email: 'reader@example.com',
      nickname: 'reader',
      password: 'hashed:local',
      authProvider: 'local',
      emailVerified: true,
    });

    jest.spyOn(verifier, 'verify').mockResolvedValueOnce({
      providerUserId: 'google-123',
      email: 'reader@example.com',
      emailVerified: false,
    });

    await expect(sut.execute({ userId: user.id, idToken: 'valid-token' })).rejects.toThrow(GoogleEmailNotVerifiedError);
  });

  it('throws when google email differs from authenticated account email', async () => {
    const user = await userRepo.create({
      name: 'Local Reader',
      email: 'reader@example.com',
      nickname: 'reader',
      password: 'hashed:local',
      authProvider: 'local',
      emailVerified: true,
    });

    jest.spyOn(verifier, 'verify').mockResolvedValueOnce({
      providerUserId: 'google-123',
      email: 'other@example.com',
      emailVerified: true,
    });

    await expect(sut.execute({ userId: user.id, idToken: 'valid-token' })).rejects.toThrow(GoogleLinkEmailMismatchError);
  });

  it('throws when provider id is already linked to another user', async () => {
    await userRepo.create({
      name: 'Already Linked',
      email: 'linked@example.com',
      nickname: 'linked',
      password: undefined,
      authProvider: 'google',
      providerId: 'google-123',
      emailVerified: true,
    });

    const user = await userRepo.create({
      name: 'Local Reader',
      email: 'reader@example.com',
      nickname: 'reader',
      password: 'hashed:local',
      authProvider: 'local',
      emailVerified: true,
    });

    await expect(sut.execute({ userId: user.id, idToken: 'valid-token' })).rejects.toThrow(GoogleProviderAlreadyLinkedError);
  });

  it('throws when authenticated user has another google provider id already linked', async () => {
    const user = await userRepo.create({
      name: 'Google Reader',
      email: 'reader@example.com',
      nickname: 'reader-google',
      password: undefined,
      authProvider: 'google',
      providerId: 'google-999',
      emailVerified: true,
    });

    await expect(sut.execute({ userId: user.id, idToken: 'valid-token' })).rejects.toThrow(GoogleAccountLinkConflictError);
  });
});