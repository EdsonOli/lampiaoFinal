/**
 * Infrastructure layer: Repositories and Services
 * Centralizes instantiation of all adapters (Sequelize, JWT, Bcrypt, etc)
 */

import { SequelizeUserRepository } from '../repositories/SequelizeUserRepository';
import { SequelizePostRepository } from '../repositories/SequelizePostRepository';
import { SequelizeCommentRepository } from '../repositories/SequelizeCommentRepository';
import { SequelizeNotebookRepository } from '../repositories/SequelizeNotebookRepository';
import { SequelizeBookRepository } from '../repositories/SequelizeBookRepository';
import { BcryptPasswordHasher } from '../services/BcryptPasswordHasher';
import { GoogleIdTokenVerifierService } from '../services/GoogleIdTokenVerifierService';
import { JwtTokenService } from '../services/JwtTokenService';
import { SupabaseImageStorageService } from '../services/SupabaseImageStorageService';

// Repositories
const userRepository = new SequelizeUserRepository();
const postRepository = new SequelizePostRepository();
const commentRepository = new SequelizeCommentRepository();
const notebookRepository = new SequelizeNotebookRepository();
const bookRepository = new SequelizeBookRepository();

// Services
const passwordHasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService();
const googleIdTokenVerifier = new GoogleIdTokenVerifierService();
const imageStorage = new SupabaseImageStorageService();

export const infrastructure = {
  repositories: {
    user: userRepository,
    post: postRepository,
    comment: commentRepository,
    notebook: notebookRepository,
    book: bookRepository,
  },
  services: {
    passwordHasher,
    tokenService,
    googleIdTokenVerifier,
    imageStorage,
  },
};
