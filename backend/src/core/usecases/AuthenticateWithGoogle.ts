import { User } from '../domain/User';
import { GoogleAccountLinkConflictError, GoogleEmailNotVerifiedError } from '../errors';
import { GoogleIdTokenVerifier } from '../ports/GoogleIdTokenVerifier';
import { UserRepository } from '../ports/UserRepository';

export interface AuthenticateWithGoogleInput {
  idToken: string;
}

export class AuthenticateWithGoogle {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly googleIdTokenVerifier: GoogleIdTokenVerifier
  ) {}

  async execute(input: AuthenticateWithGoogleInput): Promise<User> {
    const payload = await this.googleIdTokenVerifier.verify(input.idToken);

    if (!payload.emailVerified) {
      throw new GoogleEmailNotVerifiedError('Google account email is not verified');
    }

    const existingUser = await this.userRepository.findByEmail(payload.email);
    if (existingUser) {
      if (
        existingUser.authProvider === 'google'
        && existingUser.providerId
        && existingUser.providerId !== payload.providerUserId
      ) {
        throw new GoogleAccountLinkConflictError('Google account does not match existing linked account');
      }

      return existingUser;
    }

    const fallbackNickname = payload.email.split('@')[0]?.slice(0, 80) || `reader-${payload.providerUserId.slice(0, 8)}`;

    return this.userRepository.create({
      name: payload.name?.trim() || fallbackNickname,
      email: payload.email,
      nickname: fallbackNickname,
      img: payload.picture,
      password: undefined,
      authProvider: 'google',
      providerId: payload.providerUserId,
      emailVerified: true,
      role: 'user',
    });
  }
}
