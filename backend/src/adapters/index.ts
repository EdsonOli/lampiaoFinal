
import express, { Request, Response } from 'express';
import bookRoutes from './routes/bookRoutes';

const app = express();
const port = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Rota principal para teste
app.get('/', (req: Request, res: Response) => {
  res.send('API is running...');
});

// Registrando as rotas de livros sob o prefixo /api/books
app.use('/api/books', bookRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
