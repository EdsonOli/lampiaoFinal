import { NextFunction, Request, Response, Router } from 'express';
import { Container } from '../container';
import { AuthenticatedRequest, authenticate, optionalAuthenticate } from '../middlewares/authenticate';
import { auditLog } from '../services/AuditLogger';
import { getValidationMessage, isValidationError, parseOrThrow } from '../validation/parse';
import { sanitizePlainText } from '../validation/sanitizers';
import { badRequest, notFound, unauthorized, validationError } from '../http/respondError';
import {
  createPostSchema,
  getPostDraftQuerySchema,
  savePostDraftSchema,
  updatePostSchema,
} from '../validation/schemas';

const router = Router();

// Get use cases from container
const {
  createPost,
  deletePost,
  getPostById,
  listAllPosts,
  listPostsByBook,
  listPostsByUser,
  savePostDraft,
  getPostDraft,
  deletePostDraft,
  updatePost,
} = Container.useCases;

function canViewPost(post: { isItPublic: boolean; userId: string }, currentUserId?: string): boolean {
  return post.isItPublic || (currentUserId !== undefined && post.userId === currentUserId);
}

router.get('/', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const posts = await listAllPosts.execute();
    const currentUserId = req.auth?.userId;
    res.json(posts.filter(post => canViewPost(post, currentUserId)));
  } catch (error) {
    next(error);
  }
});

router.get('/book/:id', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    if (!id) {
      return badRequest(res, 'O identificador do livro informado e invalido.', 'POST_BOOK_ID_INVALID');
    }

    const posts = await listPostsByBook.execute(id);
    const currentUserId = req.auth?.userId;
    res.json(posts.filter(post => canViewPost(post, currentUserId)));
  } catch (error) {
    next(error);
  }
});

router.get('/user/:id', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    if (!id) {
      return badRequest(res, 'O identificador do usuario informado e invalido.', 'POST_USER_ID_INVALID');
    }

    const posts = await listPostsByUser.execute(id);
    const currentUserId = req.auth?.userId;
    const isOwner = currentUserId === id;
    res.json(isOwner ? posts : posts.filter(post => post.isItPublic));
  } catch (error) {
    next(error);
  }
});

router.get('/drafts/:bookId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    const bookId = String(req.params.bookId);

    if (!userId) {
      return unauthorized(res, 'Voce precisa estar autenticado para acessar rascunhos de post.', 'POST_DRAFT_AUTH_REQUIRED');
    }

    if (!bookId) {
      return badRequest(res, 'O identificador do livro informado e invalido.', 'POST_BOOK_ID_INVALID');
    }

    const query = parseOrThrow(getPostDraftQuerySchema, req.query);

    const draft = await getPostDraft.execute({
      userId,
      bookId,
      deviceId: query.deviceId,
    });

    res.json({ draft });
  } catch (error) {
    if (isValidationError(error)) {
      return validationError(res, getValidationMessage(error), 'POST_DRAFT_QUERY_INVALID');
    }

    next(error);
  }
});

router.get('/:id', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    if (!id) {
      return badRequest(res, 'O identificador do post informado e invalido.', 'POST_ID_INVALID');
    }

    const post = await getPostById.execute(id);
    if (!post) {
      return notFound(res, 'O post solicitado nao foi encontrado.', 'POST_NOT_FOUND');
    }

    if (!canViewPost(post, req.auth?.userId)) {
      return notFound(res, 'O post solicitado nao esta disponivel para visualizacao.', 'POST_NOT_VISIBLE');
    }

    res.json(post);
  } catch (error) {
    next(error);
  }
});

router.put('/drafts/:bookId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    const bookId = String(req.params.bookId);

    if (!userId) {
      return unauthorized(res, 'Voce precisa estar autenticado para salvar rascunhos.', 'POST_DRAFT_SAVE_AUTH_REQUIRED');
    }

    if (!bookId) {
      return badRequest(res, 'O identificador do livro informado e invalido.', 'POST_BOOK_ID_INVALID');
    }

    const payload = parseOrThrow(savePostDraftSchema, req.body);

    const draft = await savePostDraft.execute({
      userId,
      bookId,
      deviceId: payload.deviceId,
      title: payload.title !== undefined ? sanitizePlainText(payload.title) : undefined,
      text: payload.text !== undefined ? sanitizePlainText(payload.text) : undefined,
      isItPublic: payload.isItPublic,
    });

    await auditLog('post_draft.save', {
      draftId: draft.id,
      userId,
      bookId,
      deviceId: draft.deviceId,
      hasTitle: draft.title.length > 0,
      hasText: draft.text.length > 0,
    });

    res.json(draft);
  } catch (error) {
    if (isValidationError(error)) {
      return validationError(res, getValidationMessage(error), 'POST_DRAFT_SAVE_INVALID_PAYLOAD');
    }

    next(error);
  }
});

router.delete('/drafts/:bookId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    const bookId = String(req.params.bookId);

    if (!userId) {
      return unauthorized(res, 'Voce precisa estar autenticado para excluir rascunhos.', 'POST_DRAFT_DELETE_AUTH_REQUIRED');
    }

    if (!bookId) {
      return badRequest(res, 'O identificador do livro informado e invalido.', 'POST_BOOK_ID_INVALID');
    }

    const query = parseOrThrow(getPostDraftQuerySchema, req.query);

    await deletePostDraft.execute({
      userId,
      bookId,
      deviceId: query.deviceId,
    });

    await auditLog('post_draft.delete', {
      userId,
      bookId,
      deviceId: query.deviceId,
    });

    res.status(204).send();
  } catch (error) {
    if (isValidationError(error)) {
      return validationError(res, getValidationMessage(error), 'POST_DRAFT_DELETE_QUERY_INVALID');
    }

    next(error);
  }
});

router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return unauthorized(res, 'Voce precisa estar autenticado para publicar posts.', 'POST_CREATE_AUTH_REQUIRED');
    }

    const payload = parseOrThrow(createPostSchema, req.body);

    const post = await createPost.execute({
      title: sanitizePlainText(payload.title),
      text: sanitizePlainText(payload.text),
      bookId: payload.bookId,
      userId,
      isItPublic: typeof payload.isItPublic === 'boolean' ? payload.isItPublic : true,
    });

    await auditLog('post.create', { postId: post.id, userId, bookId: post.bookId, isItPublic: post.isItPublic });

    res.status(201).json(post);
  } catch (error) {
    if (isValidationError(error)) {
      return validationError(res, getValidationMessage(error), 'POST_CREATE_INVALID_PAYLOAD');
    }

    next(error);
  }
});

router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    const id = String(req.params.id);

    if (!userId) {
      return unauthorized(res, 'Voce precisa estar autenticado para editar posts.', 'POST_UPDATE_AUTH_REQUIRED');
    }

    if (!id) {
      return badRequest(res, 'O identificador do post informado e invalido.', 'POST_ID_INVALID');
    }

    const payload = parseOrThrow(updatePostSchema, req.body);

    const post = await updatePost.execute(id, userId, {
      title: payload.title ? sanitizePlainText(payload.title) : undefined,
      text: payload.text ? sanitizePlainText(payload.text) : undefined,
      isItPublic: typeof payload.isItPublic === 'boolean' ? payload.isItPublic : undefined,
    });

    await auditLog('post.update', { postId: id, userId, updatedFields: Object.keys(payload) });

    res.json(post);
  } catch (error) {
    if (isValidationError(error)) {
      return validationError(res, getValidationMessage(error), 'POST_UPDATE_INVALID_PAYLOAD');
    }

    next(error);
  }
});

router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    const id = String(req.params.id);

    if (!userId) {
      return unauthorized(res, 'Voce precisa estar autenticado para excluir posts.', 'POST_DELETE_AUTH_REQUIRED');
    }

    if (!id) {
      return badRequest(res, 'O identificador do post informado e invalido.', 'POST_ID_INVALID');
    }

    await deletePost.execute(id, userId);
  await auditLog('post.delete', { postId: id, userId });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
