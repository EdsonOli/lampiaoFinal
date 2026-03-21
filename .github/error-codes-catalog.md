# Catálogo de Códigos de Erro — Lampião

**Data:** 2026-03-21  
**Escopo:** Backend (Node.js/TypeScript) + Frontend (Angular)  
**Objetivo:** Documentar todos os códigos de erro semânticos para consistência entre cliente e servidor.

---

## 📋 Índice Rápido

- [Genéricos](#genéricos-http)
- [Rate Limiting](#rate-limiting)
- [Autenticação & Google Auth](#autenticação--google-auth)
- [Usuários](#usuários)
- [Livros](#livros)
- [Comentários](#comentários)
- [Registros de Leitura (Notebooks)](#registros-de-leitura-notebooks)
- [Posts](#posts)
- [Séries](#séries)
- [Upload](#upload)
- [Busca Externa](#busca-externa)
- [Admin](#admin)

---

## Genéricos (HTTP)

| Código | Status | Descrição |
|--------|--------|-----------|
| `BAD_REQUEST` | 400 | A requisição não passou nas validações básicas de contrato. |
| `UNAUTHORIZED` | 401 | A requisição exige autenticação válida. |
| `FORBIDDEN` | 403 | A requisição foi autenticada, mas não possui permissão suficiente. |
| `NOT_FOUND` | 404 | O recurso solicitado não foi encontrado. |
| `CONFLICT` | 409 | A operação conflitou com o estado atual dos dados. |
| `PAYLOAD_TOO_LARGE` | 413 | O corpo da requisição excedeu o limite configurado. |
| `INTERNAL_SERVER_ERROR` | 500 | Erro interno inesperado. |
| `VALIDATION_ERROR` | 400 | Os dados informados não passaram na validação. |
| `NETWORK_ERROR` | 0 (frontend only) | Não foi possível se comunicar com o servidor. Verifique sua conexão. |

---

## Rate Limiting

| Código | Status | Descrição | Contexto |
|--------|--------|-----------|----------|
| `RATE_LIMIT_GLOBAL` | 429 | Limite global de requisições excedido. | Applies to all requests from an IP. Default: 300 reqs/15 min. |
| `RATE_LIMIT_LOGIN` | 429 | Limite de tentativas de login excedido. | Per-IP failed login attempts. Default: 5 attempts/15 min. |
| `RATE_LIMIT_REGISTER` | 429 | Limite de tentativas de cadastro excedido. | Per-IP failed registration attempts. Default: 3 attempts/1 hour. |
| `RATE_LIMIT_COMMENT_RELEVANCE_VOTE` | 429 | Limite de votos de relevância excedido. | Per-user or per-IP comment relevance votes. |

**Nota:** Todas as respostas 429 incluem `retryAfterSeconds` no payload da API.

**Frontend:** Use `retryAfterSeconds` para mostrar ao usuário quanto tempo falta para tentar novamente.

---

## Autenticação & Google Auth

### Autenticação Básica

| Código | Status | Descrição |
|--------|--------|-----------|
| `AUTH_TOKEN_MISSING` | 401 | Nenhuma credencial de autenticação foi enviada. |
| `AUTH_SESSION_INVALID` | 401 | A sessão enviada não pode ser validada. |
| `AUTH_TOKEN_INVALID` | 401 | O token enviado é inválido ou expirou. |
| `AUTH_LOGIN_INVALID_PAYLOAD` | 400 | Payload inválido para login (email/password). |
| `AUTH_REGISTER_INVALID_PAYLOAD` | 400 | Payload inválido para cadastro. |
| `AUTH_REFRESH_TOKEN_INVALID` | 401 | Refresh token inválido ou revogado. |
| `AUTH_REFRESH_USER_NOT_FOUND` | 401 | Usuário do refresh token não encontrado. |

### Google Auth

| Código | Status | Descrição |
|--------|--------|-----------|
| `AUTH_GOOGLE_INVALID_PAYLOAD` | 400 | Payload inválido para autenticação com Google. |
| `AUTH_LINK_GOOGLE_REQUIRES_SESSION` | 401 | Vínculo de conta Google exige sessão autenticada. |
| `AUTH_LINK_GOOGLE_INVALID_PAYLOAD` | 400 | Payload inválido para vínculo de conta Google. |
| `GOOGLE_EMAIL_NOT_VERIFIED` | 400 | A conta Google ainda não possui e-mail verificado. |
| `GOOGLE_LINK_CONFLICT` | 403 | A conta Google não corresponde ao vínculo existente. |
| `GOOGLE_LINK_EMAIL_MISMATCH` | 409 | O e-mail da conta Google não corresponde ao esperado. |
| `GOOGLE_PROVIDER_ALREADY_LINKED` | 409 | A conta Google já está vinculada a outro perfil Lampião. |

**Frontend:** Use `mapGoogleAuthError()` para mensagens UX contextualizadas baseadas em `code`.

---

## Usuários

| Código | Status | Descrição |
|--------|--------|-----------|
| `USER_ME_AUTH_REQUIRED` | 401 | Leitura do próprio perfil exige autenticação. |
| `USER_ME_NOT_FOUND` | 404 | O usuário autenticado não foi encontrado. |
| `USER_UPDATE_AUTH_REQUIRED` | 401 | Atualização de perfil exige autenticação. |
| `USER_UPDATE_INVALID_PAYLOAD` | 400 | Payload inválido para atualização de perfil. |
| `USER_UPDATE_INVALID_DATA` | 400 | Os dados de perfil enviados são inválidos. |
| `USER_DELETE_AUTH_REQUIRED` | 401 | Exclusão de conta exige autenticação. |
| `USER_ID_INVALID` | 400 | O identificador do usuário é inválido. |
| `USER_NOT_FOUND` | 404 | O usuário solicitado não foi encontrado. |

---

## Livros

| Código | Status | Descrição |
|--------|--------|-----------|
| `BOOK_ID_INVALID` | 400 | O identificador do livro é inválido. |
| `BOOK_NOT_FOUND` | 404 | O livro solicitado não foi encontrado. |
| `BOOK_CREATE_INVALID_PAYLOAD` | 400 | Payload inválido para criação de livro. |
| `BOOK_ISBN_CONFLICT` | 409 | Já existe um livro com o ISBN informado. |
| `BOOK_CREATE_INVALID_DATA` | 400 | Os dados enviados para criação do livro são inválidos. |
| `BOOK_UPDATE_INVALID_PAYLOAD` | 400 | Payload inválido para atualização de livro. |
| `BOOK_UPDATE_INVALID_DATA` | 400 | Os dados enviados para atualização do livro são inválidos. |

---

## Comentários

| Código | Status | Descrição |
|--------|--------|-----------|
| `COMMENT_POST_ID_INVALID` | 400 | O identificador do post vinculado ao comentário é inválido. |
| `COMMENT_POST_NOT_FOUND` | 404 | O post vinculado ao comentário não foi encontrado. |
| `COMMENT_USER_ID_INVALID` | 400 | O identificador do usuário do comentário é inválido. |
| `COMMENT_ID_INVALID` | 400 | O identificador do comentário é inválido. |
| `COMMENT_NOT_FOUND` | 404 | O comentário solicitado não foi encontrado. |
| `COMMENT_NOT_VISIBLE` | 404 | O comentário existe, mas não está visível para o usuário atual. |
| `COMMENT_CREATE_AUTH_REQUIRED` | 401 | Criação de comentário exige autenticação. |
| `COMMENT_CREATE_INVALID_PAYLOAD` | 400 | Payload inválido para criação de comentário. |
| `COMMENT_UPDATE_AUTH_REQUIRED` | 401 | Atualização de comentário exige autenticação. |
| `COMMENT_UPDATE_INVALID_PAYLOAD` | 400 | Payload inválido para atualização de comentário. |
| `COMMENT_DELETE_AUTH_REQUIRED` | 401 | Exclusão de comentário exige autenticação. |
| `COMMENT_RELEVANCE_VOTE_AUTH_REQUIRED` | 401 | Voto de relevância exige autenticação. |
| `COMMENT_RELEVANCE_VOTE_INVALID_PAYLOAD` | 400 | Payload inválido para voto de relevância. |

---

## Registros de Leitura (Notebooks)

| Código | Status | Descrição |
|--------|--------|-----------|
| `NOTEBOOK_LIST_AUTH_REQUIRED` | 401 | Listagem de registros de leitura exige autenticação. |
| `NOTEBOOK_CREATE_AUTH_REQUIRED` | 401 | Criação de registro de leitura exige autenticação. |
| `NOTEBOOK_CREATE_INVALID_PAYLOAD` | 400 | Payload inválido para criação de registro de leitura. |
| `NOTEBOOK_UPDATE_AUTH_REQUIRED` | 401 | Atualização de registro de leitura exige autenticação. |
| `NOTEBOOK_ID_INVALID` | 400 | O identificador do registro de leitura é inválido. |
| `NOTEBOOK_UPDATE_INVALID_PAYLOAD` | 400 | Payload inválido para atualização de registro de leitura. |
| `NOTEBOOK_DELETE_AUTH_REQUIRED` | 401 | Exclusão de registro de leitura exige autenticação. |

---

## Posts

| Código | Status | Descrição |
|--------|--------|-----------|
| `POST_BOOK_ID_INVALID` | 400 | O identificador do livro vinculado ao post é inválido. |
| `POST_USER_ID_INVALID` | 400 | O identificador do usuário do post é inválido. |
| `POST_ID_INVALID` | 400 | O identificador do post é inválido. |
| `POST_NOT_FOUND` | 404 | O post solicitado não foi encontrado. |
| `POST_NOT_VISIBLE` | 404 | O post existe, mas não está visível para o usuário atual. |
| `POST_CREATE_AUTH_REQUIRED` | 401 | Criação de post exige autenticação. |
| `POST_CREATE_INVALID_PAYLOAD` | 400 | Payload inválido para criação de post. |
| `POST_UPDATE_AUTH_REQUIRED` | 401 | Atualização de post exige autenticação. |
| `POST_UPDATE_INVALID_PAYLOAD` | 400 | Payload inválido para atualização de post. |
| `POST_DELETE_AUTH_REQUIRED` | 401 | Exclusão de post exige autenticação. |
| `POST_DRAFT_AUTH_REQUIRED` | 401 | Leitura de rascunho exige autenticação. |
| `POST_DRAFT_QUERY_INVALID` | 400 | Query inválida para leitura de rascunho. |
| `POST_DRAFT_SAVE_AUTH_REQUIRED` | 401 | Salvar rascunho exige autenticação. |
| `POST_DRAFT_SAVE_INVALID_PAYLOAD` | 400 | Payload inválido para salvar rascunho. |
| `POST_DRAFT_DELETE_AUTH_REQUIRED` | 401 | Excluir rascunho exige autenticação. |
| `POST_DRAFT_DELETE_QUERY_INVALID` | 400 | Query inválida para exclusão de rascunho. |

---

## Séries

| Código | Status | Descrição |
|--------|--------|-----------|
| `SERIES_BOOK_ID_INVALID` | 400 | O identificador do livro usado para lookup de série é inválido. |
| `SERIES_NOT_FOUND` | 404 | A série solicitada não foi encontrada. |

---

## Upload

| Código | Status | Descrição |
|--------|--------|-----------|
| `UPLOAD_PROFILE_AUTH_REQUIRED` | 401 | Upload de imagem de perfil exige autenticação. |
| `UPLOAD_PROFILE_INVALID_PAYLOAD` | 400 | Payload inválido para assinatura de upload de perfil. |
| `UPLOAD_BOOK_COVER_AUTH_REQUIRED` | 401 | Upload de capa exige autenticação. |
| `UPLOAD_BOOK_COVER_INVALID_PAYLOAD` | 400 | Payload inválido para assinatura de upload de capa. |

---

## Busca Externa

| Código | Status | Descrição |
|--------|--------|-----------|
| `SEARCH_QUERY_REQUIRED` | 400 | A busca externa exige o parâmetro `q`. |
| `SEARCH_IMPORT_INVALID_PAYLOAD` | 400 | Payload inválido para importação de livro externo. |
| `SEARCH_IMPORT_ISBN_CONFLICT` | 409 | A importação falhou porque o ISBN já existe. |
| `SEARCH_IMPORT_INVALID_DATA` | 400 | Os dados do livro externo são inválidos para importação. |

---

## Admin

| Código | Status | Descrição |
|--------|--------|-----------|
| `ADMIN_ACCESS_REQUIRED` | 403 | A operação exige perfil de administrador. |
| `ADMIN_USER_ID_INVALID` | 400 | O identificador do usuário administrado é inválido. |
| `ADMIN_USER_NOT_FOUND` | 404 | O usuário administrado não foi encontrado. |
| `ADMIN_POST_ID_INVALID` | 400 | O identificador do post administrado é inválido. |
| `ADMIN_POST_NOT_FOUND` | 404 | O post administrado não foi encontrado. |
| `ADMIN_COMMENT_ID_INVALID` | 400 | O identificador do comentário administrado é inválido. |
| `ADMIN_COMMENT_NOT_FOUND` | 404 | O comentário administrado não foi encontrado. |

---

## 🎯 Como Usar

### Backend

```typescript
import { badRequest, conflict, unauthorized } from '../http/respondError';
import { FRONTEND_ERROR_CATALOG } from '../http/errorCatalog';

// Ao retornar um erro:
return badRequest(res, 'ISBN já existe no acervo.', 'BOOK_ISBN_CONFLICT');

// Validar contra catálogo:
import { isApiErrorCode } from '../http/errorCatalog';
if (isApiErrorCode(code)) {
  // Type-safe, code é garantidamente válido
}
```

### Frontend

```typescript
import { FRONTEND_ERROR_CATALOG, getUserFacingMessage } from './error-catalog';
import { normalizeApiErrorPayload } from './api-error';

// Ao receber um erro HTTP:
const payload = normalizeApiErrorPayload(httpError);

if (payload.code === FRONTEND_ERROR_CATALOG.RATE_LIMIT_LOGIN) {
  // Mostrar "Aguarde 15 minutos antes de tentar novamente"
  // com countdown baseado em retryAfterSeconds
}

// Ou usar fallback localizado:
const message = getUserFacingMessage(payload.code, payload.message);
```

---

## ⚡ Boas Práticas

1. **Nunca invente novos códigos ad hoc.** Se precisar de um novo código, atualize este documento e os catálogos backend/frontend.

2. **Use `retryAfterSeconds` para rate limiters.** Frontend pode mostrar countdown ao usuário.

3. **Branching deve ser por `code`, não por status HTTP ou regex de mensagem.**

   ```typescript
   // ✅ BOM: code-based
   if (error.code === 'RATE_LIMIT_LOGIN') { ... }
   
   // ❌ RUIM: status-based
   if (error.status === 429) { ... }
   
   // ❌ RUIM: regex-based
   if (error.message.includes('attempts')) { ... }
   ```

4. **Fallback PT-BR local.** Se o Payload vier vazio ou inválido, use `FRONTEND_ERROR_MESSAGES`.

5. **Mensagens ao usuário devem ser acionáveis.** Não basta dizer "erro", diga "Aguarde 15 minutos antes de tentar novamente."

---

## 📊 Estatísticas

- **Total de códigos:** 106
- **Status 400 (Bad Request):** ~45
- **Status 401 (Unauthorized):** ~20
- **Status 403 (Forbidden):** ~4
- **Status 404 (Not Found):** ~15
- **Status 409 (Conflict):** ~6
- **Status 429 (Rate Limited):** ~4
- **Status 500 (Internal Error):** ~1
- **Status 0 (Network, frontend only):** ~1

---

**Última atualização:** 2026-03-21  
**Próxima revisão:** Quando novos endpoints ou códigos forem adicionados.
