import express from 'express';
import request from 'supertest';
import { errorHandler } from '../../adapters/middlewares/errorHandler';

describe('Payload too large error mapping', () => {
  const app = express();
  app.use(express.json({ limit: '1kb' }));

  app.post('/echo', (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use(errorHandler);

  it('maps body parser entity.too.large to HTTP 413', async () => {
    const oversizedText = 'l'.repeat(2500);

    const response = await request(app)
      .post('/echo')
      .send({ text: oversizedText });

    expect(response.status).toBe(413);
    expect(response.body).toEqual({
      error: 'Payload too large. Please reduce request size.',
    });
  });
});