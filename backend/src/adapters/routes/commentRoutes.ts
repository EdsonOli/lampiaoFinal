import { NextFunction, Response, Router } from 'express';
import { Container } from '../container';
import { toCommentListWithViewerVote, toCommentTreeWithViewerVote } from '../presenters/CommentPresenter';
import { AuthenticatedRequest, authenticate, optionalAuthenticate } from '../middlewares/authenticate';
import { commentRelevanceVoteRateLimiter } from '../middlewares/rateLimiters';
import { auditLog } from '../services/AuditLogger';
import { getValidationMessage, isValidationError, parseOrThrow } from '../validation/parse';
import { sanitizePlainText } from '../validation/sanitizers';
import { createCommentSchema, updateCommentSchema, voteCommentRelevanceSchema } from '../validation/schemas';
import { badRequest, notFound, unauthorized, validationError } from '../http/respondError';

const router = Router();

// Get use cases and repositories from container
const {
  createComment,
  deleteComment,
  getCommentById,
  getPostById,
  getPostsByIds,
  getCommentRelevanceVotesByUser,
  listAllComments,
  listCommentTreeByPost,
  listCommentsByPost,
  listCommentsByUser,
  updateComment,
  voteCommentRelevance,
} = Container.useCases;

async function canViewPostById(postId: string, currentUserId?: string): Promise<boolean> {
  const post = await getPostById.execute(postId);
  if (!post) {
    return false;
  }

  return post.isItPublic || (currentUserId !== undefined && post.userId === currentUserId);
}

async function buildVisiblePostIdSet(postIds: string[], currentUserId?: string): Promise<Set<string>> {
  const uniquePostIds = [...new Set(postIds.filter(Boolean))];
  if (uniquePostIds.length === 0) {
    return new Set();
  }

  const posts = await getPostsByIds.execute(uniquePostIds);
  const visible = new Set<string>();

  posts.forEach(post => {
    if (post.isItPublic || (currentUserId !== undefined && post.userId === currentUserId)) {
      visible.add(post.id);
    }
  });

  return visible;
}

function flattenCommentTreeIds(tree: Array<{ id: string; children: Array<{ id: string; children: any[] }> }>): string[] {
  const ids: string[] = [];

  const visit = (nodes: Array<{ id: string; children: Array<{ id: string; children: any[] }> }>): void => {
    nodes.forEach(node => {
      ids.push(node.id);
      visit(node.children);
    });
  };

  visit(tree);
  return ids;
}

router.get('/', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const comments = await listAllComments.execute();
    const currentUserId = req.auth?.userId;
    const visiblePostIds = await buildVisiblePostIdSet(
      comments.map(comment => comment.postId),
      currentUserId
    );
    const visibleComments = comments.filter(comment => visiblePostIds.has(comment.postId));

    res.json(visibleComments);
  } catch (error) {
    next(error);
  }
});

router.get('/post/:id', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    if (!id) {
      return badRequest(res, 'O identificador do post informado e invalido.', 'COMMENT_POST_ID_INVALID');
    }

    const canView = await canViewPostById(id, req.auth?.userId);
    if (!canView) {
      return notFound(res, 'Nao foi possivel encontrar um post visivel com esse identificador.', 'COMMENT_POST_NOT_FOUND');
    }

    const comments = await listCommentsByPost.execute(id);
    const currentUserId = req.auth?.userId;
    if (!currentUserId) {
      return res.json(comments);
    }

    const votesByCommentId = await getCommentRelevanceVotesByUser.execute(
      currentUserId,
      comments.map(comment => comment.id)
    );

    res.json(toCommentListWithViewerVote(comments, votesByCommentId));
  } catch (error) {
    next(error);
  }
});

router.get('/post/:id/tree', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    if (!id) {
      return badRequest(res, 'O identificador do post informado e invalido.', 'COMMENT_POST_ID_INVALID');
    }

    const canView = await canViewPostById(id, req.auth?.userId);
    if (!canView) {
      return notFound(res, 'Nao foi possivel encontrar um post visivel com esse identificador.', 'COMMENT_POST_NOT_FOUND');
    }

    const comments = await listCommentTreeByPost.execute(id);
    const currentUserId = req.auth?.userId;
    if (!currentUserId) {
      return res.json(comments);
    }

    const votesByCommentId = await getCommentRelevanceVotesByUser.execute(
      currentUserId,
      flattenCommentTreeIds(comments)
    );

    res.json(toCommentTreeWithViewerVote(comments, votesByCommentId));
  } catch (error) {
    next(error);
  }
});

router.get('/user/:id', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    if (!id) {
      return badRequest(res, 'O identificador do usuario informado e invalido.', 'COMMENT_USER_ID_INVALID');
    }

    const comments = await listCommentsByUser.execute(id);
    const currentUserId = req.auth?.userId;
    if (currentUserId === id) {
      return res.json(comments);
    }

    const visiblePostIds = await buildVisiblePostIdSet(
      comments.map(comment => comment.postId),
      currentUserId
    );
    const visibleComments = comments.filter(comment => visiblePostIds.has(comment.postId));

    res.json(visibleComments);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    if (!id) {
      return badRequest(res, 'O identificador do comentario informado e invalido.', 'COMMENT_ID_INVALID');
    }

    const comment = await getCommentById.execute(id);
    if (!comment) {
      return notFound(res, 'O comentario solicitado nao foi encontrado.', 'COMMENT_NOT_FOUND');
    }

    const canView = await canViewPostById(comment.postId, req.auth?.userId);
    if (!canView) {
      return notFound(res, 'O comentario solicitado nao esta disponivel para visualizacao.', 'COMMENT_NOT_VISIBLE');
    }

    res.json(comment);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return unauthorized(res, 'Voce precisa estar autenticado para criar comentarios.', 'COMMENT_CREATE_AUTH_REQUIRED');
    }

    const payload = parseOrThrow(createCommentSchema, req.body);

    const comment = await createComment.execute({
      title: sanitizePlainText(payload.title),
      text: sanitizePlainText(payload.text),
      postId: payload.postId,
      parentCommentId: payload.parentCommentId,
      userId,
    });

    await auditLog('comment.create', { commentId: comment.id, userId, postId: comment.postId });

    res.status(201).json(comment);
  } catch (error) {
    if (isValidationError(error)) {
      return validationError(res, getValidationMessage(error), 'COMMENT_CREATE_INVALID_PAYLOAD');
    }

    next(error);
  }
});

router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    const id = String(req.params.id);

    if (!userId) {
      return unauthorized(res, 'Voce precisa estar autenticado para editar comentarios.', 'COMMENT_UPDATE_AUTH_REQUIRED');
    }

    if (!id) {
      return badRequest(res, 'O identificador do comentario informado e invalido.', 'COMMENT_ID_INVALID');
    }

    const payload = parseOrThrow(updateCommentSchema, req.body);
    const comment = await updateComment.execute(id, userId, {
      title: payload.title ? sanitizePlainText(payload.title) : undefined,
      text: payload.text ? sanitizePlainText(payload.text) : undefined,
    });
    await auditLog('comment.update', { commentId: id, userId, updatedFields: Object.keys(payload) });
    res.json(comment);
  } catch (error) {
    if (isValidationError(error)) {
      return validationError(res, getValidationMessage(error), 'COMMENT_UPDATE_INVALID_PAYLOAD');
    }

    next(error);
  }
});

router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    const id = String(req.params.id);

    if (!userId) {
      return unauthorized(res, 'Voce precisa estar autenticado para excluir comentarios.', 'COMMENT_DELETE_AUTH_REQUIRED');
    }

    if (!id) {
      return badRequest(res, 'O identificador do comentario informado e invalido.', 'COMMENT_ID_INVALID');
    }

    await deleteComment.execute(id, userId);
  await auditLog('comment.delete', { commentId: id, userId });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.put('/:id/relevance-vote', authenticate, commentRelevanceVoteRateLimiter, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    const commentId = String(req.params.id);

    if (!userId) {
      return unauthorized(res, 'Voce precisa estar autenticado para votar na relevancia de comentarios.', 'COMMENT_RELEVANCE_VOTE_AUTH_REQUIRED');
    }

    if (!commentId) {
      return badRequest(res, 'O identificador do comentario informado e invalido.', 'COMMENT_ID_INVALID');
    }

    const payload = parseOrThrow(voteCommentRelevanceSchema, req.body);
    const comment = await voteCommentRelevance.execute({
      commentId,
      userId,
      value: payload.value,
    });

    await auditLog('comment.relevance_vote', {
      commentId,
      userId,
      value: payload.value,
      relevanceScore: comment.relevanceScore,
    });

    res.json(comment);
  } catch (error) {
    if (isValidationError(error)) {
      return validationError(res, getValidationMessage(error), 'COMMENT_RELEVANCE_VOTE_INVALID_PAYLOAD');
    }

    next(error);
  }
});

export default router;
