export interface VerifiedGoogleToken {
  providerUserId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

export interface GoogleIdTokenVerifier {
  verify(idToken: string): Promise<VerifiedGoogleToken>;
}
