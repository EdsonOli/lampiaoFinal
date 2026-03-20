export class TokenBlacklistService {
  private readonly revokedTokens = new Map<string, number>();

  constructor() {
    const cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60_000);

    cleanupInterval.unref?.();
  }

  revoke(token: string, expiresAtSeconds?: number): void {
    const fallbackTtlMs = 7 * 24 * 60 * 60 * 1000;
    const expiresAtMs = expiresAtSeconds ? expiresAtSeconds * 1000 : Date.now() + fallbackTtlMs;
    this.revokedTokens.set(token, expiresAtMs);
  }

  isRevoked(token: string): boolean {
    const expiresAtMs = this.revokedTokens.get(token);

    if (!expiresAtMs) {
      return false;
    }

    if (expiresAtMs <= Date.now()) {
      this.revokedTokens.delete(token);
      return false;
    }

    return true;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();

    for (const [token, expiresAtMs] of this.revokedTokens.entries()) {
      if (expiresAtMs <= now) {
        this.revokedTokens.delete(token);
      }
    }
  }
}

export const tokenBlacklistService = new TokenBlacklistService();