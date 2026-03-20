
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
import uploadRoutes from './routes/uploadRoutes';
import userRoutes from './routes/userRoutes';
import sequelize from '../config/database';
import { initModels } from './models/initModels';
import { errorHandler } from './middlewares/errorHandler';
import { globalRateLimiter } from './middlewares/rateLimiters';

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

if (forceHttpsRedirect) {
  app.use((req: Request, res: Response, next) => {
    const forwardedProto = req.headers['x-forwarded-proto'];
    const isHttps = req.secure || forwardedProto === 'https';

    if (isHttps) {
      next();
      return;
    }

    if (!req.headers.host) {
      res.status(400).json({ message: 'Invalid host header' });
      return;
    }

    res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  });
}

app.use(cookieParser());
app.use(express.json());
app.use(globalRateLimiter);

// Health check
app.get('/', (req: Request, res: Response) => {
  res.send('API is running...');
});

// Registrando as rotas de livros sob o prefixo /api/books
app.use('/api/auth', cors(credentialedCorsOptions), authRoutes);
app.use('/api/admin', cors(credentialedCorsOptions), adminRoutes);
app.use('/api/books', cors(publicCorsOptions), bookRoutes);
app.use('/api/comments', cors(credentialedCorsOptions), commentRoutes);
app.use('/api/notebooks', cors(credentialedCorsOptions), notebookRoutes);
app.use('/api/posts', cors(credentialedCorsOptions), postRoutes);
app.use('/api/uploads', cors(credentialedCorsOptions), uploadRoutes);
app.use('/api/users', cors(credentialedCorsOptions), userRoutes);

app.use('/api/v1/auth', cors(credentialedCorsOptions), authRoutes);
app.use('/api/v1/admin', cors(credentialedCorsOptions), adminRoutes);
app.use('/api/v1/books', cors(publicCorsOptions), bookRoutes);
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
    console.log(`Server running on port ${port}`);
  });
};

if (skipDbSync) {
  console.warn('Starting without database sync because SKIP_DB_SYNC=true');
  startServer();
} else {
  sequelize
    .sync({ alter: false })
    .then(() => {
      startServer();
    })
    .catch((err: Error) => {
      console.error('Failed to sync database:', err.message);
      process.exit(1);
    });
}
