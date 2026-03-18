'''
import express from 'express';
import { GetAllBooks } from '../../core/usecases/GetAllBooks';
import { GetBookById } from '../../core/usecases/GetBookById';
// Importa o repositório do Sequelize em vez do In-Memory
import { SequelizeBookRepository } from '../../adapters/repositories/SequelizeBookRepository';

const router = express.Router();

// Instancia o repositório do Sequelize
const bookRepository = new SequelizeBookRepository();

// Instancia os casos de uso com o repositório
const getAllBooks = new GetAllBooks(bookRepository);
const getBookById = new GetBookById(bookRepository);

// Rota para obter todos os livros
router.get('/books', async (req, res) => {
    try {
        const books = await getAllBooks.execute();
        res.json(books);
    } catch (error) {
        res.status(500).send('Error fetching books');
    }
});

// Rota para obter um livro por ID
router.get('/books/:id', async (req, res) => {
    try {
        const book = await getBookById.execute(req.params.id);
        if (book) {
            res.json(book);
        } else {
            res.status(404).send('Book not found');
        }
    } catch (error) {
        res.status(500).send('Error fetching book');
    }
});

export default router;
'''