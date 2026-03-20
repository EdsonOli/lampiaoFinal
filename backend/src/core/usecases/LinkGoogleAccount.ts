import { User } from '../domain/User';
import {
  GoogleAccountLinkConflictError,
  GoogleEmailNotVerifiedError,
  GoogleLinkEmailMismatchError,
  GoogleProviderAlreadyLinkedError,
  NotFoundError,
} from '../errors';
import { GoogleIdTokenVerifier } from '../ports/GoogleIdTokenVerifier';
import { UserRepository } from '../ports/UserRepository';

export interface LinkGoogleAccountInput {
  userId: string;
  idToken: string;
}

export class LinkGoogleAccount {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly googleIdTokenVerifier: GoogleIdTokenVerifier
  ) {}

  async execute(input: LinkGoogleAccountInput): Promise<User> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const payload = await this.googleIdTokenVerifier.verify(input.idToken);

    if (!payload.emailVerified) {
      throw new GoogleEmailNotVerifiedError('Google account email is not verified');
    }

    if (payload.email !== user.email) {
      throw new GoogleLinkEmailMismatchError('Google account email must match your current account email');
    }

    const linkedUser = await this.userRepository.findByProviderId(payload.providerUserId);
    if (linkedUser && linkedUser.id !== user.id) {
      throw new GoogleProviderAlreadyLinkedError('This Google account is already linked to another Lampiao account');
    }

    if (user.authProvider === 'google' && user.providerId && user.providerId !== payload.providerUserId) {
      throw new GoogleAccountLinkConflictError('Google account does not match existing linked account');
    }

    const updatedUser = await this.userRepository.update(user.id, {
      authProvider: 'google',
      providerId: payload.providerUserId,
      emailVerified: true,
      img: user.img ?? payload.picture,
    });

    if (!updatedUser) {
      throw new NotFoundError('User not found');
    }

    return updatedUser;
  }
}