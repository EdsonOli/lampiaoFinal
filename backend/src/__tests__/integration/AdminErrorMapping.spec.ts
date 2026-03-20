import express from 'express';
import request from 'supertest';
import adminRoutes from '../../adapters/routes/adminRoutes';
import { errorHandler } from '../../adapters/middlewares/errorHandler';
import { NotFoundError } from '../../core/errors';

let currentRole: 'user' | 'admin' = 'user';

jest.mock('../../adapters/container', () => ({
  Container: {
    useCases: {
      getCommentById: { execute: jest.fn() },
      getPostById: { execute: jest.fn() },
      deleteComment: { execute: jest.fn() },
      deletePost: { execute: jest.fn() },
      deleteUser: { execute: jest.fn() },
      getUserById: { execute: jest.fn() },
      listAllComments: { execute: jest.fn() },
      listAllPosts: { execute: jest.fn() },
      listAllUsers: { execute: jest.fn() },
    },
  },
}));

jest.mock('../../adapters/middlewares/authenticate', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.auth = {
      userId: 'test-user-id',
      email: 'test@example.com',
      role: currentRole,
    };
    next();
  },
}));

const {
  Container: {
    useCases: { listAllUsers, deleteUser },
  },
} = jest.requireMock('../../adapters/container') as {
  Container: {
    useCases: {
      listAllUsers: {
        execute: jest.Mock;
      };
      deleteUser: {
        execute: jest.Mock;
      };
    };
  };
};

const mockListAllUsersExecute = listAllUsers.execute;
const mockDeleteUserExecute = deleteUser.execute;

describe('Admin route semantic error mapping', () => {
  const app = express();
  app.use(express.json());
  app.use('/admin', adminRoutes);
  app.use(errorHandler);

  beforeEach(() => {
    jest.clearAllMocks();
    currentRole = 'user';
  });

  it('returns HTTP 403 for non-admin users', async () => {
    const response = await request(app).get('/admin/users');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: 'Admin access required' });
    expect(mockListAllUsersExecute).not.toHaveBeenCalled();
  });

  it('maps NotFoundError to HTTP 404 for admin routes', async () => {
    currentRole = 'admin';
    mockDeleteUserExecute.mockRejectedValueOnce(new NotFoundError('User not found'));

    const response = await request(app).delete('/admin/users/0f35f590-f3df-4f77-b55b-c8f47cfd11d8');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'User not found' });
  });
});
