import express from 'express';
import request from 'supertest';
import authRoutes from '../../adapters/routes/authRoutes';
import { errorHandler } from '../../adapters/middlewares/errorHandler';
import { ConflictError, ValidationError } from '../../core/errors';

jest.mock('../../adapters/container', () => ({
  Container: {
    useCases: {
      createUser: { execute: jest.fn() },
      authenticateUser: { execute: jest.fn() },
      getUserById: { execute: jest.fn() },
    },
    services: {
      tokenService: {
        sign: jest.fn(),
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
    useCases: { createUser },
  },
} = jest.requireMock('../../adapters/container') as {
  Container: {
    useCases: {
      createUser: {
        execute: jest.Mock;
      };
    };
  };
};

const mockCreateUserExecute = createUser.execute;

describe('Auth route semantic error mapping', () => {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRoutes);
  app.use(errorHandler);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps ValidationError to HTTP 400', async () => {
    mockCreateUserExecute.mockRejectedValueOnce(new ValidationError('Invalid profile image'));

    const response = await request(app)
      .post('/auth/register')
      .send({
        name: 'Alice',
        email: 'alice@example.com',
        nickname: 'ali',
        password: 'Abcdef1234!',
        confirmPassword: 'Abcdef1234!',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid profile image' });
  });

  it('maps ConflictError to HTTP 409', async () => {
    mockCreateUserExecute.mockRejectedValueOnce(new ConflictError('User email already exists'));

    const response = await request(app)
      .post('/auth/register')
      .send({
        name: 'Bob',
        email: 'bob@example.com',
        nickname: 'bobby',
        password: 'Abcdef1234!',
        confirmPassword: 'Abcdef1234!',
      });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'User email already exists' });
  });
});
