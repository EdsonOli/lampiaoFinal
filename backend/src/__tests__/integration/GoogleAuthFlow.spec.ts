import express from 'express';
import request from 'supertest';
import authRoutes from '../../adapters/routes/authRoutes';
import { errorHandler } from '../../adapters/middlewares/errorHandler';
import { GoogleAccountLinkConflictError, GoogleEmailNotVerifiedError } from '../../core/errors';

jest.mock('../../adapters/container', () => ({
  Container: {
    useCases: {
      createUser: { execute: jest.fn() },
      authenticateUser: { execute: jest.fn() },
      authenticateWithGoogle: { execute: jest.fn() },
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
    useCases: { authenticateWithGoogle },
  },
} = jest.requireMock('../../adapters/container') as {
  Container: {
    useCases: {
      authenticateWithGoogle: {
        execute: jest.Mock;
      };
    };
  };
};

const mockAuthenticateWithGoogle = authenticateWithGoogle.execute;

describe('Google auth route', () => {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRoutes);
  app.use(errorHandler);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 and session cookies for valid id token', async () => {
    mockAuthenticateWithGoogle.mockResolvedValueOnce({
      id: 'e0cc8020-c818-4863-8245-cd0d3da4c122',
      name: 'Leitora Google',
      email: 'leitora@example.com',
      nickname: 'leitora-google',
      img: 'https://example.com/avatar.png',
      role: 'user',
    });

    const response = await request(app)
      .post('/auth/google')
      .send({ idToken: 'valid-google-id-token-1234567890' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: {
        id: 'e0cc8020-c818-4863-8245-cd0d3da4c122',
        name: 'Leitora Google',
        email: 'leitora@example.com',
        nickname: 'leitora-google',
        img: 'https://example.com/avatar.png',
      },
    });
    expect(response.headers['set-cookie']).toEqual(expect.arrayContaining([
      expect.stringContaining('lampiao_auth='),
      expect.stringContaining('lampiao_refresh='),
    ]));
  });

  it('maps ValidationError to HTTP 400', async () => {
    mockAuthenticateWithGoogle.mockRejectedValueOnce(new GoogleEmailNotVerifiedError('Google account email is not verified'));

    const response = await request(app)
      .post('/auth/google')
      .send({ idToken: 'valid-google-id-token-1234567890' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Google account email is not verified',
      code: 'GOOGLE_EMAIL_NOT_VERIFIED',
    });
  });

  it('maps ForbiddenError to HTTP 403', async () => {
    mockAuthenticateWithGoogle.mockRejectedValueOnce(new GoogleAccountLinkConflictError('Google account does not match existing linked account'));

    const response = await request(app)
      .post('/auth/google')
      .send({ idToken: 'valid-google-id-token-1234567890' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: 'Google account does not match existing linked account',
      code: 'GOOGLE_LINK_CONFLICT',
    });
  });

  it('returns HTTP 400 when payload is invalid', async () => {
    const response = await request(app)
      .post('/auth/google')
      .send({ idToken: 'short' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'String must contain at least 20 character(s)' });
    expect(mockAuthenticateWithGoogle).not.toHaveBeenCalled();
  });
});
