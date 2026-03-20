# Status da Refatoracao do Lampiao

## Concluido
- [x] Criar backend TypeScript separado em `backend/`
- [x] Organizar estrutura base em `core`, `adapters` e `entrypoints`
- [x] Corrigir erros iniciais de compilacao do backend TS
- [x] Configurar build TypeScript funcional
- [x] Configurar conexao com MariaDB via `.env`
- [x] Criar `config/config.js` para o Sequelize CLI carregar variaveis de ambiente
- [x] Criar banco `lampiao_api` no MariaDB
- [x] Executar migrations iniciais no MariaDB
- [x] Criar dominio de `Book`
- [x] Criar port de `BookRepository`
- [x] Implementar repositarios `Book` em memoria e Sequelize
- [x] Criar model Sequelize de `Book`
- [x] Criar rotas `GET /api/books` e `GET /api/books/:id`
- [x] Alinhar schema de `books` com o legado
- [x] Criar dominios de `User`, `Post`, `Notebook` e `Comment`
- [x] Criar ports de `User`, `Post`, `Notebook` e `Comment`
- [x] Criar models Sequelize de `User`, `Post`, `Notebook` e `Comment`
- [x] Criar associacoes Sequelize entre `Book`, `User`, `Post`, `Notebook` e `Comment`
- [x] Criar migrations de `users`, `posts`, `notebooks` e `comments`
- [x] Criar repositarios Sequelize de `User`, `Post`, `Notebook` e `Comment`
- [x] Implementar autenticacao JWT
- [x] Implementar hash de senha com `bcryptjs`
- [x] Criar caso de uso `CreateUser`
- [x] Criar caso de uso `AuthenticateUser`
- [x] Criar caso de uso `GetUserById`
- [x] Criar rotas `POST /api/auth/register` e `POST /api/auth/login`
- [x] Criar rotas `GET /api/users/me` e `GET /api/users/:id`
- [x] Validar fluxo completo de cadastro, login e perfil autenticado
- [x] Expandir contrato de `NotebookRepository`
- [x] Criar casos de uso de notebook para criar, listar, atualizar e deletar
- [x] Criar rotas `GET /api/notebooks/me`, `POST /api/notebooks`, `PUT /api/notebooks/:id` e `DELETE /api/notebooks/:id`
- [x] Executar seed inicial de livros
- [x] Validar fluxo completo de notebooks com JWT

## Em andamento
- [x] Implementar fatia de `Posts` com regras de autoria
- [x] Implementar fatia de `Comments` com regras de autoria
- [x] Implementar update e delete de usuario
- [x] Criar testes automatizados dos casos de uso principais (28 testes, Jest + ts-jest)
- [x] Padronizar tratamento global de erros HTTP (`errorHandler` middleware + `next(error)` em todas as rotas)
- [x] Iniciar migracao do frontend para Angular (Angular CLI 21, SSR, projeto em `frontend/`)
- [x] Criar `AuthService` com JWT no localStorage
- [x] Criar `authInterceptor` funcional (Bearer token)
- [x] Criar `authGuard` para rotas protegidas
- [x] Criar `ApiService` (posts e livros)
- [x] Migrar tela de login para Angular
- [x] Migrar tela de cadastro para Angular
- [x] Migrar timeline para Angular (listagem de posts)
- [x] Configurar rotas Angular com lazy loading
- [x] Criar Navbar global com estado de autenticação
- [x] Ampliar `ApiService` com notebooks, perfil, posts por usuário
- [x] Migrar listagem de livros para Angular (`/livros`)
- [x] Migrar detalhe do livro para Angular (`/livros/:id`)
- [x] Migrar perfil do usuario para Angular (`/perfil`) com edição inline

## Pendente
- [x] Desativar gradualmente views EJS do legado (código legado deletado)
- [x] Definir estratégia de autorização por recurso:
  - Campo `role: 'user' | 'admin'` no domínio e banco (migration aplicada)
  - Middleware `requireAdmin` protege todas as rotas `/api/admin/*`
  - Rotas admin: `GET/DELETE /api/admin/users`, `GET/DELETE /api/admin/posts`, `GET/DELETE /api/admin/comments`
  - Usuário admin pode deletar qualquer recurso sem verificação de autoria

## Projeto concluído ✅
Todos os objetivos do plano de refatoração foram atingidos.
