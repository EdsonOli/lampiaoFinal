/**
 * Use Case Factory
 * Instantiates all use cases with injected dependencies from infrastructure layer
 */

import { infrastructure } from './infrastructure';

// Auth use cases
import { AuthenticateUser } from '../../core/usecases/AuthenticateUser';

// User use cases
import { CreateUser } from '../../core/usecases/CreateUser';
import { UpdateUser } from '../../core/usecases/UpdateUser';
import { DeleteUser } from '../../core/usecases/DeleteUser';
import { GetUserById } from '../../core/usecases/GetUserById';
import { ListAllUsers } from '../../core/usecases/ListAllUsers';

// Post use cases
import { CreatePost } from '../../core/usecases/CreatePost';
import { UpdatePost } from '../../core/usecases/UpdatePost';
import { DeletePost } from '../../core/usecases/DeletePost';
import { GetPostById } from '../../core/usecases/GetPostById';
import { ListAllPosts } from '../../core/usecases/ListAllPosts';
import { ListPostsByBook } from '../../core/usecases/ListPostsByBook';
import { ListPostsByUser } from '../../core/usecases/ListPostsByUser';

// Comment use cases
import { CreateComment } from '../../core/usecases/CreateComment';
import { UpdateComment } from '../../core/usecases/UpdateComment';
import { DeleteComment } from '../../core/usecases/DeleteComment';
import { GetCommentById } from '../../core/usecases/GetCommentById';
import { ListAllComments } from '../../core/usecases/ListAllComments';
import { ListCommentsByPost } from '../../core/usecases/ListCommentsByPost';
import { ListCommentsByUser } from '../../core/usecases/ListCommentsByUser';

// Notebook use cases
import { CreateNotebookEntry } from '../../core/usecases/CreateNotebookEntry';
import { UpdateNotebookEntry } from '../../core/usecases/UpdateNotebookEntry';
import { DeleteNotebookEntry } from '../../core/usecases/DeleteNotebookEntry';
import { ListUserNotebooks } from '../../core/usecases/ListUserNotebooks';

// Book use cases
import { CreateBook } from '../../core/usecases/CreateBook';
import { GetBooks } from '../../core/usecases/GetBooks';
import { GetBookById } from '../../core/usecases/GetBookById';
import { ListAllBooks } from '../../core/usecases/ListAllBooks';

const createUseCases = () => ({
  // Auth
  authenticateUser: new AuthenticateUser(
    infrastructure.repositories.user,
    infrastructure.services.passwordHasher,
    infrastructure.services.tokenService
  ),

  // User
  createUser: new CreateUser(
    infrastructure.repositories.user,
    infrastructure.services.passwordHasher
  ),
  updateUser: new UpdateUser(
    infrastructure.repositories.user,
    infrastructure.services.passwordHasher
  ),
  deleteUser: new DeleteUser(infrastructure.repositories.user),
  getUserById: new GetUserById(infrastructure.repositories.user),
  listAllUsers: new ListAllUsers(infrastructure.repositories.user),

  // Post
  createPost: new CreatePost(
    infrastructure.repositories.post,
    infrastructure.repositories.book
  ),
  updatePost: new UpdatePost(infrastructure.repositories.post),
  deletePost: new DeletePost(infrastructure.repositories.post),
  getPostById: new GetPostById(infrastructure.repositories.post),
  listAllPosts: new ListAllPosts(infrastructure.repositories.post),
  listPostsByBook: new ListPostsByBook(infrastructure.repositories.post),
  listPostsByUser: new ListPostsByUser(infrastructure.repositories.post),

  // Comment
  createComment: new CreateComment(
    infrastructure.repositories.comment,
    infrastructure.repositories.post
  ),
  updateComment: new UpdateComment(infrastructure.repositories.comment),
  deleteComment: new DeleteComment(infrastructure.repositories.comment),
  getCommentById: new GetCommentById(infrastructure.repositories.comment),
  listAllComments: new ListAllComments(infrastructure.repositories.comment),
  listCommentsByPost: new ListCommentsByPost(infrastructure.repositories.comment),
  listCommentsByUser: new ListCommentsByUser(infrastructure.repositories.comment),

  // Notebook
  createNotebookEntry: new CreateNotebookEntry(
    infrastructure.repositories.notebook,
    infrastructure.repositories.book
  ),
  updateNotebookEntry: new UpdateNotebookEntry(infrastructure.repositories.notebook),
  deleteNotebookEntry: new DeleteNotebookEntry(infrastructure.repositories.notebook),
  listUserNotebooks: new ListUserNotebooks(infrastructure.repositories.notebook),

  // Book
  createBook: new CreateBook(infrastructure.repositories.book),
  getBooks: new GetBooks(infrastructure.repositories.book),
  getBookById: new GetBookById(infrastructure.repositories.book),
  listAllBooks: new ListAllBooks(infrastructure.repositories.book),
});

export type UseCases = ReturnType<typeof createUseCases>;

let useCasesInstance: UseCases | null = null;

/**
 * Get or create use cases singleton
 * Called once at app initialization
 */
export const getUseCases = (): UseCases => {
  if (!useCasesInstance) {
    useCasesInstance = createUseCases();
  }
  return useCasesInstance;
};
