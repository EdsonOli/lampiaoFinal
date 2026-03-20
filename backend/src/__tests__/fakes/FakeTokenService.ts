import { TokenPayload, TokenService } from '../../core/ports/TokenService';

export class FakeTokenService implements TokenService {
  async sign(payload: TokenPayload): Promise<string> {
    return `token:${payload.sub}:${payload.email}`;
  }

  async verify(token: string): Promise<TokenPayload> {
    const parts = token.split(':');
    if (parts.length < 3 || parts[0] !== 'token') {
      throw new Error('Invalid token');
    }
    return { sub: parts[1], email: parts[2] };
  }
}
