/**
 * Espelha o catálogo de códigos de erro do backend.
 * Garante que frontend e backend falam a mesma linguagem de códigos.
 */

export const FRONTEND_ERROR_CATALOG = {
  // Genéricos
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',

  // Infraestrutura
  HOST_HEADER_INVALID: 'HOST_HEADER_INVALID',

  // Rate limiting
  RATE_LIMIT_GLOBAL: 'RATE_LIMIT_GLOBAL',
  RATE_LIMIT_LOGIN: 'RATE_LIMIT_LOGIN',
  RATE_LIMIT_REGISTER: 'RATE_LIMIT_REGISTER',
  RATE_LIMIT_COMMENT_RELEVANCE_VOTE: 'RATE_LIMIT_COMMENT_RELEVANCE_VOTE',

  // Admin
  ADMIN_ACCESS_REQUIRED: 'ADMIN_ACCESS_REQUIRED',
  ADMIN_USER_ID_INVALID: 'ADMIN_USER_ID_INVALID',
  ADMIN_USER_NOT_FOUND: 'ADMIN_USER_NOT_FOUND',
  ADMIN_POST_ID_INVALID: 'ADMIN_POST_ID_INVALID',
  ADMIN_POST_NOT_FOUND: 'ADMIN_POST_NOT_FOUND',
  ADMIN_COMMENT_ID_INVALID: 'ADMIN_COMMENT_ID_INVALID',
  ADMIN_COMMENT_NOT_FOUND: 'ADMIN_COMMENT_NOT_FOUND',

  // Autenticação
  AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
  AUTH_SESSION_INVALID: 'AUTH_SESSION_INVALID',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_REGISTER_INVALID_PAYLOAD: 'AUTH_REGISTER_INVALID_PAYLOAD',
  AUTH_GOOGLE_INVALID_PAYLOAD: 'AUTH_GOOGLE_INVALID_PAYLOAD',
  AUTH_LINK_GOOGLE_REQUIRES_SESSION: 'AUTH_LINK_GOOGLE_REQUIRES_SESSION',
  AUTH_LINK_GOOGLE_INVALID_PAYLOAD: 'AUTH_LINK_GOOGLE_INVALID_PAYLOAD',
  AUTH_LOGIN_INVALID_PAYLOAD: 'AUTH_LOGIN_INVALID_PAYLOAD',
  AUTH_REFRESH_TOKEN_INVALID: 'AUTH_REFRESH_TOKEN_INVALID',
  AUTH_REFRESH_USER_NOT_FOUND: 'AUTH_REFRESH_USER_NOT_FOUND',

  // Google Auth
  GOOGLE_EMAIL_NOT_VERIFIED: 'GOOGLE_EMAIL_NOT_VERIFIED',
  GOOGLE_LINK_CONFLICT: 'GOOGLE_LINK_CONFLICT',
  GOOGLE_LINK_EMAIL_MISMATCH: 'GOOGLE_LINK_EMAIL_MISMATCH',
  GOOGLE_PROVIDER_ALREADY_LINKED: 'GOOGLE_PROVIDER_ALREADY_LINKED',

  // Usuário
  USER_ME_AUTH_REQUIRED: 'USER_ME_AUTH_REQUIRED',
  USER_ME_NOT_FOUND: 'USER_ME_NOT_FOUND',
  USER_UPDATE_AUTH_REQUIRED: 'USER_UPDATE_AUTH_REQUIRED',
  USER_UPDATE_INVALID_PAYLOAD: 'USER_UPDATE_INVALID_PAYLOAD',
  USER_UPDATE_INVALID_DATA: 'USER_UPDATE_INVALID_DATA',
  USER_DELETE_AUTH_REQUIRED: 'USER_DELETE_AUTH_REQUIRED',
  USER_ID_INVALID: 'USER_ID_INVALID',
  USER_NOT_FOUND: 'USER_NOT_FOUND',

  // Livro
  BOOK_ID_INVALID: 'BOOK_ID_INVALID',
  BOOK_NOT_FOUND: 'BOOK_NOT_FOUND',
  BOOK_CREATE_INVALID_PAYLOAD: 'BOOK_CREATE_INVALID_PAYLOAD',
  BOOK_ISBN_CONFLICT: 'BOOK_ISBN_CONFLICT',
  BOOK_CREATE_INVALID_DATA: 'BOOK_CREATE_INVALID_DATA',
  BOOK_UPDATE_INVALID_PAYLOAD: 'BOOK_UPDATE_INVALID_PAYLOAD',
  BOOK_UPDATE_INVALID_DATA: 'BOOK_UPDATE_INVALID_DATA',

  // Comentário
  COMMENT_POST_ID_INVALID: 'COMMENT_POST_ID_INVALID',
  COMMENT_POST_NOT_FOUND: 'COMMENT_POST_NOT_FOUND',
  COMMENT_USER_ID_INVALID: 'COMMENT_USER_ID_INVALID',
  COMMENT_ID_INVALID: 'COMMENT_ID_INVALID',
  COMMENT_NOT_FOUND: 'COMMENT_NOT_FOUND',
  COMMENT_NOT_VISIBLE: 'COMMENT_NOT_VISIBLE',
  COMMENT_CREATE_AUTH_REQUIRED: 'COMMENT_CREATE_AUTH_REQUIRED',
  COMMENT_CREATE_INVALID_PAYLOAD: 'COMMENT_CREATE_INVALID_PAYLOAD',
  COMMENT_UPDATE_AUTH_REQUIRED: 'COMMENT_UPDATE_AUTH_REQUIRED',
  COMMENT_UPDATE_INVALID_PAYLOAD: 'COMMENT_UPDATE_INVALID_PAYLOAD',
  COMMENT_DELETE_AUTH_REQUIRED: 'COMMENT_DELETE_AUTH_REQUIRED',
  COMMENT_RELEVANCE_VOTE_AUTH_REQUIRED: 'COMMENT_RELEVANCE_VOTE_AUTH_REQUIRED',
  COMMENT_RELEVANCE_VOTE_INVALID_PAYLOAD: 'COMMENT_RELEVANCE_VOTE_INVALID_PAYLOAD',

  // Notebook (Registro de Leitura)
  NOTEBOOK_LIST_AUTH_REQUIRED: 'NOTEBOOK_LIST_AUTH_REQUIRED',
  NOTEBOOK_CREATE_AUTH_REQUIRED: 'NOTEBOOK_CREATE_AUTH_REQUIRED',
  NOTEBOOK_CREATE_INVALID_PAYLOAD: 'NOTEBOOK_CREATE_INVALID_PAYLOAD',
  NOTEBOOK_UPDATE_AUTH_REQUIRED: 'NOTEBOOK_UPDATE_AUTH_REQUIRED',
  NOTEBOOK_ID_INVALID: 'NOTEBOOK_ID_INVALID',
  NOTEBOOK_UPDATE_INVALID_PAYLOAD: 'NOTEBOOK_UPDATE_INVALID_PAYLOAD',
  NOTEBOOK_DELETE_AUTH_REQUIRED: 'NOTEBOOK_DELETE_AUTH_REQUIRED',

  // Post
  POST_BOOK_ID_INVALID: 'POST_BOOK_ID_INVALID',
  POST_USER_ID_INVALID: 'POST_USER_ID_INVALID',
  POST_DRAFT_AUTH_REQUIRED: 'POST_DRAFT_AUTH_REQUIRED',
  POST_DRAFT_QUERY_INVALID: 'POST_DRAFT_QUERY_INVALID',
  POST_ID_INVALID: 'POST_ID_INVALID',
  POST_NOT_FOUND: 'POST_NOT_FOUND',
  POST_NOT_VISIBLE: 'POST_NOT_VISIBLE',
  POST_DRAFT_SAVE_AUTH_REQUIRED: 'POST_DRAFT_SAVE_AUTH_REQUIRED',
  POST_DRAFT_SAVE_INVALID_PAYLOAD: 'POST_DRAFT_SAVE_INVALID_PAYLOAD',
  POST_DRAFT_DELETE_AUTH_REQUIRED: 'POST_DRAFT_DELETE_AUTH_REQUIRED',
  POST_DRAFT_DELETE_QUERY_INVALID: 'POST_DRAFT_DELETE_QUERY_INVALID',
  POST_CREATE_AUTH_REQUIRED: 'POST_CREATE_AUTH_REQUIRED',
  POST_CREATE_INVALID_PAYLOAD: 'POST_CREATE_INVALID_PAYLOAD',
  POST_UPDATE_AUTH_REQUIRED: 'POST_UPDATE_AUTH_REQUIRED',
  POST_UPDATE_INVALID_PAYLOAD: 'POST_UPDATE_INVALID_PAYLOAD',
  POST_DELETE_AUTH_REQUIRED: 'POST_DELETE_AUTH_REQUIRED',

  // Série
  SERIES_BOOK_ID_INVALID: 'SERIES_BOOK_ID_INVALID',
  SERIES_NOT_FOUND: 'SERIES_NOT_FOUND',

  // Upload
  UPLOAD_PROFILE_AUTH_REQUIRED: 'UPLOAD_PROFILE_AUTH_REQUIRED',
  UPLOAD_PROFILE_INVALID_PAYLOAD: 'UPLOAD_PROFILE_INVALID_PAYLOAD',
  UPLOAD_BOOK_COVER_AUTH_REQUIRED: 'UPLOAD_BOOK_COVER_AUTH_REQUIRED',
  UPLOAD_BOOK_COVER_INVALID_PAYLOAD: 'UPLOAD_BOOK_COVER_INVALID_PAYLOAD',

  // Busca Externe
  SEARCH_QUERY_REQUIRED: 'SEARCH_QUERY_REQUIRED',
  SEARCH_IMPORT_INVALID_PAYLOAD: 'SEARCH_IMPORT_INVALID_PAYLOAD',
  SEARCH_IMPORT_ISBN_CONFLICT: 'SEARCH_IMPORT_ISBN_CONFLICT',
  SEARCH_IMPORT_INVALID_DATA: 'SEARCH_IMPORT_INVALID_DATA',
} as const;

export type FrontendErrorCode = typeof FRONTEND_ERROR_CATALOG[keyof typeof FRONTEND_ERROR_CATALOG];

/**
 * Guarda de tipo para verificar se uma string é um código válido do catálogo.
 */
export function isFrontendErrorCode(code: string): code is FrontendErrorCode {
  return Object.values(FRONTEND_ERROR_CATALOG).includes(code as FrontendErrorCode);
}

/**
 * Mapa de mensagens padrão baseadas em código.
 * Usa-se quando a mensagem do servidor não está disponível ou precisa fallback PT-BR.
 */
export const FRONTEND_ERROR_MESSAGES: Record<FrontendErrorCode, string> = {
  BAD_REQUEST: 'Não foi possível processar os dados informados.',
  UNAUTHORIZED: 'Sua sessão não é válida para esta operação.',
  FORBIDDEN: 'Você não tem permissão para executar esta operação.',
  NOT_FOUND: 'O recurso solicitado não foi encontrado.',
  CONFLICT: 'Não foi possível concluir a operação por conflito de dados.',
  PAYLOAD_TOO_LARGE: 'O corpo da requisição excede o limite permitido.',
  RATE_LIMITED: 'Muitas tentativas em pouco tempo. Tente novamente em instantes.',
  INTERNAL_SERVER_ERROR: 'Ocorreu um erro interno inesperado. Tente novamente em instantes.',
  VALIDATION_ERROR: 'Os dados informados não passaram na validação.',
  NETWORK_ERROR: 'Não foi possível se comunicar com o Lampião. Verifique sua conexão e tente novamente.',

  HOST_HEADER_INVALID: 'Configuração inválida do servidor.',

  RATE_LIMIT_GLOBAL: 'Muitas requisições foram feitas em pouco tempo. Aguarde alguns instantes antes de tentar novamente.',
  RATE_LIMIT_LOGIN: 'Muitas tentativas de login falharam em pouco tempo. Aguarde cerca de 15 minutos antes de tentar novamente.',
  RATE_LIMIT_REGISTER: 'Muitas tentativas de cadastro falharam em pouco tempo. Aguarde antes de tentar novamente.',
  RATE_LIMIT_COMMENT_RELEVANCE_VOTE: 'Você excedeu o limite de votos de relevância em comentários. Aguarde um pouco antes de tentar novamente.',

  ADMIN_ACCESS_REQUIRED: 'A operação exige perfil de administrador.',
  ADMIN_USER_ID_INVALID: 'O identificador do usuário administrado é inválido.',
  ADMIN_USER_NOT_FOUND: 'O usuário administrado não foi encontrado.',
  ADMIN_POST_ID_INVALID: 'O identificador do post administrado é inválido.',
  ADMIN_POST_NOT_FOUND: 'O post administrado não foi encontrado.',
  ADMIN_COMMENT_ID_INVALID: 'O identificador do comentário administrado é inválido.',
  ADMIN_COMMENT_NOT_FOUND: 'O comentário administrado não foi encontrado.',

  AUTH_TOKEN_MISSING: 'Nenhuma credencial de autenticação foi enviada.',
  AUTH_SESSION_INVALID: 'A sessão enviada não pode ser validada.',
  AUTH_TOKEN_INVALID: 'O token enviado é inválido ou expirou.',
  AUTH_REGISTER_INVALID_PAYLOAD: 'Payload inválido para cadastro.',
  AUTH_GOOGLE_INVALID_PAYLOAD: 'Payload inválido para autenticação com Google.',
  AUTH_LINK_GOOGLE_REQUIRES_SESSION: 'Vínculo de conta Google exige sessão autenticada.',
  AUTH_LINK_GOOGLE_INVALID_PAYLOAD: 'Payload inválido para vínculo de conta Google.',
  AUTH_LOGIN_INVALID_PAYLOAD: 'Payload inválido para login.',
  AUTH_REFRESH_TOKEN_INVALID: 'Refresh token inválido ou revogado.',
  AUTH_REFRESH_USER_NOT_FOUND: 'Usuário do refresh token não encontrado.',

  GOOGLE_EMAIL_NOT_VERIFIED: 'A conta Google ainda não possui e-mail verificado.',
  GOOGLE_LINK_CONFLICT: 'A conta Google não corresponde ao vínculo existente.',
  GOOGLE_LINK_EMAIL_MISMATCH: 'O e-mail da conta Google não corresponde ao esperado para o vínculo.',
  GOOGLE_PROVIDER_ALREADY_LINKED: 'A conta Google já está vinculada a outro perfil.',

  USER_ME_AUTH_REQUIRED: 'Leitura do próprio perfil exige autenticação.',
  USER_ME_NOT_FOUND: 'O usuário autenticado não foi encontrado.',
  USER_UPDATE_AUTH_REQUIRED: 'Atualização de perfil exige autenticação.',
  USER_UPDATE_INVALID_PAYLOAD: 'Payload inválido para atualização de perfil.',
  USER_UPDATE_INVALID_DATA: 'Os dados de perfil enviados são inválidos.',
  USER_DELETE_AUTH_REQUIRED: 'Exclusão de conta exige autenticação.',
  USER_ID_INVALID: 'O identificador do usuário é inválido.',
  USER_NOT_FOUND: 'O usuário solicitado não foi encontrado.',

  BOOK_ID_INVALID: 'O identificador do livro é inválido.',
  BOOK_NOT_FOUND: 'O livro solicitado não foi encontrado.',
  BOOK_CREATE_INVALID_PAYLOAD: 'Payload inválido para criação de livro.',
  BOOK_ISBN_CONFLICT: 'Já existe um livro com o ISBN informado.',
  BOOK_CREATE_INVALID_DATA: 'Os dados enviados para criação do livro são inválidos.',
  BOOK_UPDATE_INVALID_PAYLOAD: 'Payload inválido para atualização de livro.',
  BOOK_UPDATE_INVALID_DATA: 'Os dados enviados para atualização do livro são inválidos.',

  COMMENT_POST_ID_INVALID: 'O identificador do post vinculado ao comentário é inválido.',
  COMMENT_POST_NOT_FOUND: 'O post vinculado ao comentário não foi encontrado.',
  COMMENT_USER_ID_INVALID: 'O identificador do usuário do comentário é inválido.',
  COMMENT_ID_INVALID: 'O identificador do comentário é inválido.',
  COMMENT_NOT_FOUND: 'O comentário solicitado não foi encontrado.',
  COMMENT_NOT_VISIBLE: 'O comentário existe, mas não está visível para o usuário atual.',
  COMMENT_CREATE_AUTH_REQUIRED: 'Criação de comentário exige autenticação.',
  COMMENT_CREATE_INVALID_PAYLOAD: 'Payload inválido para criação de comentário.',
  COMMENT_UPDATE_AUTH_REQUIRED: 'Atualização de comentário exige autenticação.',
  COMMENT_UPDATE_INVALID_PAYLOAD: 'Payload inválido para atualização de comentário.',
  COMMENT_DELETE_AUTH_REQUIRED: 'Exclusão de comentário exige autenticação.',
  COMMENT_RELEVANCE_VOTE_AUTH_REQUIRED: 'Voto de relevância exige autenticação.',
  COMMENT_RELEVANCE_VOTE_INVALID_PAYLOAD: 'Payload inválido para voto de relevância.',

  NOTEBOOK_LIST_AUTH_REQUIRED: 'Listagem de registros de leitura exige autenticação.',
  NOTEBOOK_CREATE_AUTH_REQUIRED: 'Criação de registro de leitura exige autenticação.',
  NOTEBOOK_CREATE_INVALID_PAYLOAD: 'Payload inválido para criação de registro de leitura.',
  NOTEBOOK_UPDATE_AUTH_REQUIRED: 'Atualização de registro de leitura exige autenticação.',
  NOTEBOOK_ID_INVALID: 'O identificador do registro de leitura é inválido.',
  NOTEBOOK_UPDATE_INVALID_PAYLOAD: 'Payload inválido para atualização de registro de leitura.',
  NOTEBOOK_DELETE_AUTH_REQUIRED: 'Exclusão de registro de leitura exige autenticação.',

  POST_BOOK_ID_INVALID: 'O identificador do livro vinculado ao post é inválido.',
  POST_USER_ID_INVALID: 'O identificador do usuário do post é inválido.',
  POST_DRAFT_AUTH_REQUIRED: 'Leitura de rascunho exige autenticação.',
  POST_DRAFT_QUERY_INVALID: 'Query inválida para leitura de rascunho.',
  POST_ID_INVALID: 'O identificador do post é inválido.',
  POST_NOT_FOUND: 'O post solicitado não foi encontrado.',
  POST_NOT_VISIBLE: 'O post existe, mas não está visível para o usuário atual.',
  POST_DRAFT_SAVE_AUTH_REQUIRED: 'Salvar rascunho exige autenticação.',
  POST_DRAFT_SAVE_INVALID_PAYLOAD: 'Payload inválido para salvar rascunho.',
  POST_DRAFT_DELETE_AUTH_REQUIRED: 'Excluir rascunho exige autenticação.',
  POST_DRAFT_DELETE_QUERY_INVALID: 'Query inválida para exclusão de rascunho.',
  POST_CREATE_AUTH_REQUIRED: 'Criação de post exige autenticação.',
  POST_CREATE_INVALID_PAYLOAD: 'Payload inválido para criação de post.',
  POST_UPDATE_AUTH_REQUIRED: 'Atualização de post exige autenticação.',
  POST_UPDATE_INVALID_PAYLOAD: 'Payload inválido para atualização de post.',
  POST_DELETE_AUTH_REQUIRED: 'Exclusão de post exige autenticação.',

  SERIES_BOOK_ID_INVALID: 'O identificador do livro usado para lookup de série é inválido.',
  SERIES_NOT_FOUND: 'A série solicitada não foi encontrada.',

  UPLOAD_PROFILE_AUTH_REQUIRED: 'Upload de imagem de perfil exige autenticação.',
  UPLOAD_PROFILE_INVALID_PAYLOAD: 'Payload inválido para assinatura de upload de perfil.',
  UPLOAD_BOOK_COVER_AUTH_REQUIRED: 'Upload de capa exige autenticação.',
  UPLOAD_BOOK_COVER_INVALID_PAYLOAD: 'Payload inválido para assinatura de upload de capa.',

  SEARCH_QUERY_REQUIRED: 'A busca externa exige o parâmetro q.',
  SEARCH_IMPORT_INVALID_PAYLOAD: 'Payload inválido para importação de livro externo.',
  SEARCH_IMPORT_ISBN_CONFLICT: 'A importação falhou porque o ISBN já existe.',
  SEARCH_IMPORT_INVALID_DATA: 'Os dados do livro externo são inválidos para importação.',
};

/**
 * Retorna uma mensagem de apresentação baseada no código de erro.
 * Prioridade:
 * 1. Mensagem do servidor (passada como argumento)
 * 2. Fallback PT-BR do catálogo local
 */
export function getUserFacingMessage(code: FrontendErrorCode | string, serverMessage?: string): string {
  if (serverMessage?.trim()) {
    return serverMessage;
  }

  if (isFrontendErrorCode(code)) {
    return FRONTEND_ERROR_MESSAGES[code];
  }

  return 'Ocorreu um erro inesperado. Tente novamente em instantes.';
}
