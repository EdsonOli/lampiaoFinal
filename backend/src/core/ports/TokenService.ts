export interface TokenPayload {
  sub: string;
  email: string;
  exp?: number;
}

export interface TokenService {
  sign(payload: TokenPayload): Promise<string>;
  verify(token: string): Promise<TokenPayload>;
}
