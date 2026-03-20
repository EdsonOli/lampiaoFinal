import jwt from 'jsonwebtoken';
import { TokenPayload, TokenService } from '../../core/ports/TokenService';

export class JwtTokenService implements TokenService {
  private readonly secret: string;
  private readonly expiresIn: jwt.SignOptions['expiresIn'];

  constructor(options?: { secret?: string; expiresIn?: string | number }) {
    this.secret = options?.secret || process.env.JWT_SECRET || 'lampiao-dev-secret';
    const configuredExpiresIn = options?.expiresIn ?? process.env.JWT_EXPIRES_IN ?? '7d';
    this.expiresIn = configuredExpiresIn as jwt.SignOptions['expiresIn'];
  }

  async sign(payload: TokenPayload): Promise<string> {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  async verify(token: string): Promise<TokenPayload> {
    const decoded = jwt.verify(token, this.secret);

    if (typeof decoded === 'string' || !decoded.sub || !decoded.email) {
      throw new Error('Invalid token');
    }

    return {
      sub: String(decoded.sub),
      email: String(decoded.email),
      exp: typeof decoded.exp === 'number' ? decoded.exp : undefined,
    };
  }
}
