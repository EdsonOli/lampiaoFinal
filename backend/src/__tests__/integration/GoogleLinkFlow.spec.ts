import express from 'express';
import request from 'supertest';
import authRoutes from '../../adapters/routes/authRoutes';
import { errorHandler } from '../../adapters/middlewares/errorHandler';
import { GoogleLinkEmailMismatchError, GoogleProviderAlreadyLinkedError } from '../../core/errors';

jest.mock('../../adapters/middlewares/authenticate', () => ({
  authenticate: (req: any, _res: any, next: () => void) => {
    req.auth = {
      userId: 'b212f0e7-98ae-42da-9e53-c2065cd21a56',
      email: 'reader@example.com',
      role: 'user',
    };
    next();
  },
  optionalAuthenticate: (_req: any, _res: any, next: () => void) => next(),
}));

jest.mock('../../adapters/container', () => ({
  Container: {
    useCases: {
      createUser: { execute: jest.fn() },
      authenticateUser: { execute: jest.fn() },
      authenticateWithGoogle: { execute: jest.fn() },
      linkGoogleAccount: { execute: jest.fn() },
      getUserById: { execute: jest.fn() },
    },
    services: {
      tokenService: {
        sign: jest.fn().mockResolvedValue('access-token'),
        verify: jest.fn(),
      },
    },
  },
}));

jest.mock('../../adapters/services/AuditLogger', () => ({
  auditLog: jest.fn().mockResolvedValue(undefined),
}));

const {
  Container: {
    useCases: { linkGoogleAccount },
  },
} = jest.requireMock('../../adapters/container') as {
  Container: {
    useCases: {
      linkGoogleAccount: {
        execute: jest.Mock;
      };
    };
  };
};

const mockLinkGoogleAccount = linkGoogleAccount.execute;

describe('Google link route', () => {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRoutes);
  app.use(errorHandler);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 when linking google account succeeds', async () => {
    mockLinkGoogleAccount.mockResolvedValueOnce({
      id: 'b212f0e7-98ae-42da-9e53-c2065cd21a56',
      name: 'Leitor Lampiao',
      email: 'reader@example.com',
      nickname: 'reader',
      img: 'https://example.com/avatar.png',
      role: 'user',
      authProvider: 'google',
      providerId: 'google-123',
      emailVerified: true,
    });

    const response = await request(app)
      .post('/auth/google/link')
      .send({ idToken: 'valid-google-id-token-1234567890' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: {
        id: 'b212f0e7-98ae-42da-9e53-c2065cd21a56',
        name: 'Leitor Lampiao',
        email: 'reader@example.com',
        nickname: 'reader',
        img: 'https://example.com/avatar.png',
      },
    });
  });

  it('maps email mismatch to HTTP 403 with semantic code', async () => {
    mockLinkGoogleAccount.mockRejectedValueOnce(new GoogleLinkEmailMismatchError('Google account email must match your current account email'));

    const response = await request(app)
      .post('/auth/google/link')
      .send({ idToken: 'valid-google-id-token-1234567890' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: 'Google account email must match your current account email',
      code: 'GOOGLE_LINK_EMAIL_MISMATCH',
    });
  });

  it('maps provider already linked to HTTP 409 with semantic code', async () => {
    mockLinkGoogleAccount.mockRejectedValueOnce(new GoogleProviderAlreadyLinkedError('This Google account is already linked to another Lampiao account'));

    const response = await request(app)
      .post('/auth/google/link')
      .send({ idToken: 'valid-google-id-token-1234567890' });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: 'This Google account is already linked to another Lampiao account',
      code: 'GOOGLE_PROVIDER_ALREADY_LINKED',
    });
  });
});