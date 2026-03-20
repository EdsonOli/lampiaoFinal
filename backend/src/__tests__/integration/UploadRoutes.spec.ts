import express from 'express';
import request from 'supertest';
import uploadRoutes from '../../adapters/routes/uploadRoutes';
import { errorHandler } from '../../adapters/middlewares/errorHandler';

jest.mock('../../adapters/middlewares/authenticate', () => ({
  authenticate: (req: any, _res: any, next: () => void) => {
    req.auth = {
      userId: '4e03d64a-ef83-4f64-bf0a-30454de39df9',
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
      createProfileImageUploadUrl: { execute: jest.fn() },
      createBookCoverUploadUrl: { execute: jest.fn() },
    },
  },
}));

jest.mock('../../adapters/services/AuditLogger', () => ({
  auditLog: jest.fn().mockResolvedValue(undefined),
}));

const {
  Container: {
    useCases: { createProfileImageUploadUrl, createBookCoverUploadUrl },
  },
} = jest.requireMock('../../adapters/container') as {
  Container: {
    useCases: {
      createProfileImageUploadUrl: {
        execute: jest.Mock;
      };
      createBookCoverUploadUrl: {
        execute: jest.Mock;
      };
    };
  };
};

describe('Upload routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/uploads', uploadRoutes);
  app.use(errorHandler);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns signed URL payload for profile image upload', async () => {
    createProfileImageUploadUrl.execute.mockResolvedValueOnce({
      uploadUrl: 'https://upload.example.com/signed',
      publicUrl: 'https://public.example.com/users/id/avatar.webp',
      path: 'users/id/avatar.webp',
    });

    const response = await request(app)
      .post('/uploads/profile/sign')
      .send({ fileName: 'avatar.webp', mimeType: 'image/webp' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      uploadUrl: 'https://upload.example.com/signed',
      publicUrl: 'https://public.example.com/users/id/avatar.webp',
      path: 'users/id/avatar.webp',
    });
  });

  it('returns 400 for invalid payload', async () => {
    const response = await request(app)
      .post('/uploads/profile/sign')
      .send({ fileName: '', mimeType: 'image/webp' });

    expect(response.status).toBe(400);
    expect(createProfileImageUploadUrl.execute).not.toHaveBeenCalled();
  });

  it('returns signed URL payload for book cover upload', async () => {
    createBookCoverUploadUrl.execute.mockResolvedValueOnce({
      uploadUrl: 'https://upload.example.com/book-cover-signed',
      publicUrl: 'https://public.example.com/books/drafts/id/capa.webp',
      path: 'books/drafts/id/capa.webp',
    });

    const response = await request(app)
      .post('/uploads/book-cover/sign')
      .send({ fileName: 'capa.webp', mimeType: 'image/webp' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      uploadUrl: 'https://upload.example.com/book-cover-signed',
      publicUrl: 'https://public.example.com/books/drafts/id/capa.webp',
      path: 'books/drafts/id/capa.webp',
    });
  });

  it('returns 400 for invalid book cover payload', async () => {
    const response = await request(app)
      .post('/uploads/book-cover/sign')
      .send({ fileName: '', mimeType: 'image/webp' });

    expect(response.status).toBe(400);
    expect(createBookCoverUploadUrl.execute).not.toHaveBeenCalled();
  });
});
