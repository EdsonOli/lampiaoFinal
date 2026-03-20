import { OAuth2Client } from 'google-auth-library';
import { ValidationError } from '../../core/errors';
import { GoogleIdTokenVerifier, VerifiedGoogleToken } from '../../core/ports/GoogleIdTokenVerifier';

export class GoogleIdTokenVerifierService implements GoogleIdTokenVerifier {
  private readonly client: OAuth2Client;
  private readonly audience: string;

  constructor(clientId?: string) {
    this.audience = clientId || process.env.GOOGLE_CLIENT_ID || '';
    this.client = new OAuth2Client(this.audience || undefined);
  }

  async verify(idToken: string): Promise<VerifiedGoogleToken> {
    if (!this.audience) {
      throw new ValidationError('Google sign-in is not configured');
    }

    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: this.audience,
    });

    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email) {
      throw new ValidationError('Invalid Google token payload');
    }

    return {
      providerUserId: payload.sub,
      email: payload.email,
      emailVerified: Boolean(payload.email_verified),
      name: payload.name,
      picture: payload.picture,
    };
  }
}
