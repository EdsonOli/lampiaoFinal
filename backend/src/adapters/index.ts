
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import adminRoutes from './routes/adminRoutes';
import authRoutes from './routes/authRoutes';
import bookRoutes from './routes/bookRoutes';
import commentRoutes from './routes/commentRoutes';
import notebookRoutes from './routes/notebookRoutes';
import postRoutes from './routes/postRoutes';
import searchRoutes from './routes/searchRoutes';
import seriesRoutes from './routes/seriesRoutes';
import uploadRoutes from './routes/uploadRoutes';
import userRoutes from './routes/userRoutes';
import sequelize from '../config/database';
import { initModels } from './models/initModels';
import { errorHandler } from './middlewares/errorHandler';
import { globalRateLimiter } from './middlewares/rateLimiters';
import { badRequest } from './http/respondError';
import { requestContext } from './middlewares/requestContext';
import { appLogger, serializeError } from './services/AppLogger';

const app = express();
const port = process.env.PORT || 3000;
const skipDbSync = process.env.SKIP_DB_SYNC === 'true';
const trustProxyEnabled = process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:4200')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === 'production';
const forceHttpsRedirect = process.env.FORCE_HTTPS_REDIRECT === 'true';

if (trustProxyEnabled) {
  app.set('trust proxy', 1);
}

function resolveOrigin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void): void {
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error('CORS not allowed'));
}

const publicCorsOptions = {
  origin: resolveOrigin,
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const credentialedCorsOptions = {
  origin: resolveOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const securityHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", ...allowedOrigins, 'https://www.googleapis.com', 'https://openlibrary.org', 'https://covers.openlibrary.org'],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: isProduction
    ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      }
    : false,
  referrerPolicy: { policy: 'no-referrer' },
});

// Middleware para parsear JSON
app.use(securityHeaders);
app.use(requestContext);

if (forceHttpsRedirect) {
  app.use((req: Request, res: Response, next) => {
    const forwardedProto = req.headers['x-forwarded-proto'];
    const isHttps = req.secure || forwardedProto === 'https';

    if (isHttps) {
      next();
      return;
    }

    if (!req.headers.host) {
      badRequest(res, 'O cabecalho Host da requisicao e invalido.', 'HOST_HEADER_INVALID');
      return;
    }

    res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  });
}

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(globalRateLimiter);

// Health check
app.get('/', (req: Request, res: Response) => {
  res.send('API is running...');
});

// Health endpoint for Docker/Kubernetes
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', service: 'lampiao-api' });
});

// Registrando as rotas de livros sob o prefixo /api/books
app.use('/api/auth', cors(credentialedCorsOptions), authRoutes);
app.use('/api/admin', cors(credentialedCorsOptions), adminRoutes);
app.use('/api/books', cors(publicCorsOptions), bookRoutes);
app.use('/api/search-books', cors(credentialedCorsOptions), searchRoutes);
app.use('/api/series', cors(publicCorsOptions), seriesRoutes);
app.use('/api/comments', cors(credentialedCorsOptions), commentRoutes);
app.use('/api/notebooks', cors(credentialedCorsOptions), notebookRoutes);
app.use('/api/posts', cors(credentialedCorsOptions), postRoutes);
app.use('/api/uploads', cors(credentialedCorsOptions), uploadRoutes);
app.use('/api/users', cors(credentialedCorsOptions), userRoutes);

app.use('/api/v1/auth', cors(credentialedCorsOptions), authRoutes);
app.use('/api/v1/admin', cors(credentialedCorsOptions), adminRoutes);
app.use('/api/v1/books', cors(publicCorsOptions), bookRoutes);
app.use('/api/v1/search-books', cors(credentialedCorsOptions), searchRoutes);
app.use('/api/v1/series', cors(publicCorsOptions), seriesRoutes);
app.use('/api/v1/comments', cors(credentialedCorsOptions), commentRoutes);
app.use('/api/v1/notebooks', cors(credentialedCorsOptions), notebookRoutes);
app.use('/api/v1/posts', cors(credentialedCorsOptions), postRoutes);
app.use('/api/v1/uploads', cors(credentialedCorsOptions), uploadRoutes);
app.use('/api/v1/users', cors(credentialedCorsOptions), userRoutes);

// Middleware global de tratamento de erros (deve ser o último middleware)
app.use(errorHandler);

initModels();

const startServer = (): void => {
  app.listen(port, () => {
    appLogger.info('server.started', 'Lampiao API server started', {
      port,
      environment: process.env.NODE_ENV || 'development',
      trustProxyEnabled,
    });
  });
};

if (skipDbSync) {
  appLogger.warn('database.sync.skipped', 'Starting without database sync because SKIP_DB_SYNC=true');
  startServer();
} else {
  sequelize
    .sync({ alter: false })
    .then(() => {
      appLogger.info('database.sync.completed', 'Database synchronization completed successfully');
      startServer();
    })
    .catch((err: Error) => {
      appLogger.error('database.sync.failed', 'Failed to synchronize database before startup', {
        error: serializeError(err),
      });
      process.exit(1);
    });
}
