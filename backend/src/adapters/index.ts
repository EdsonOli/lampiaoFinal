
import cors from 'cors';
import express, { Request, Response } from 'express';
import adminRoutes from './routes/adminRoutes';
import authRoutes from './routes/authRoutes';
import bookRoutes from './routes/bookRoutes';
import commentRoutes from './routes/commentRoutes';
import notebookRoutes from './routes/notebookRoutes';
import postRoutes from './routes/postRoutes';
import userRoutes from './routes/userRoutes';
import sequelize from '../config/database';
import { initModels } from './models/initModels';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
const port = process.env.PORT || 3000;
const skipDbSync = process.env.SKIP_DB_SYNC === 'true';
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:4200';

const corsOptions = {
  origin: frontendOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware para parsear JSON
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Health check
app.get('/', (req: Request, res: Response) => {
  res.send('API is running...');
});

// Registrando as rotas de livros sob o prefixo /api/books
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notebooks', notebookRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);

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
