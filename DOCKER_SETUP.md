# 🚀 Lampião - Docker Setup & Running Guide

## Visão Geral da Infraestrutura

Lampião segue uma arquitetura containerizada com:
- **Backend**: Node.js + TypeScript + Express.js (porta 3001)
- **Frontend**: Angular 21 + SSR (porta 4200 dev, 4000 prod)
- **Database**: PostgreSQL 15 (porta 5432, interna)
- **Networking**: Docker Compose bridge network (`lampiao-network`)

## Prerequisites

Certifique-se que você tem instalado:
- Docker Desktop (v20.10+)
- Docker Compose (v2.0+)
- Git

## Configuração Rápida

### 1. Clonar e Preparar

```bash
# Já está no projeto, então:
# Verifique se existe o arquivo .env
cat .env
```

Se o arquivo `.env` não existir, ele foi criado automaticamente. Ele contém as variáveis de ambiente para desenvolvimento.

### 2. Construir as Imagens Docker

```bash
# Build das imagens (backend e frontend)
docker-compose build

# Isto vai:
# - Build do Dockerfile.backend (Node.js 18 + TypeScript compile)
# - Build do Dockerfile.frontend (Angular 21 + SSR)
```

### 3. Iniciar os Serviços

```bash
# Iniciar todos os serviços (postgres, backend, frontend)
docker-compose up -d

# Ou, para ver logs em tempo real:
docker-compose up
```

**O que acontece na startup:**
1. **PostgreSQL** inicia e aguarda estar pronto (healthcheck)
2. **Backend** espera o PostgreSQL estar saudável
3. **Backend** executa `npm run db:migrate` (cria/atualiza schema)
4. **Backend** inicia em modo dev (`npm run dev`) com hot-reload
5. **Frontend** instala dependências e inicia `ng serve` (hot-reload)

### 4. Verificar Status

```bash
# Ver status dos containers
docker-compose ps

# Ver logs de um serviço específico (backend, frontend, postgres)
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Seguir logs em tempo real
docker-compose logs -f
```

### 5. Acessar a Aplicação

| Serviço | URL | Descrição |
|---------|-----|----------|
| Frontend | http://localhost:4200 | Angular UI (desenvolvimento) |
| Backend API | http://localhost:3001 | API REST |
| API Health | http://localhost:3001/health | Status da API |
| Database | localhost:5432 | PostgreSQL (interno) |

## Commando Úteis

### Gerenciar Dados

```bash
# Rodar migrations
docker-compose exec backend npm run db:migrate

# Seed inicial de dados
docker-compose exec backend npm run db:seed:all

# Reset do banco (careful!)
docker-compose exec backend npm run db:reset

# Acessar PostgreSQL CLI
docker-compose exec postgres psql -U lampiao -d lampiao_db
```

### Desenvolvimento

```bash
# Pausar serviços
docker-compose pause

# Resumir serviços
docker-compose unpause

# Stopar tudo (mantém volumes)
docker-compose stop

# Remover containers e relancer
docker-compose down
docker-compose up -d

# Forçar rebuild
docker-compose up -d --build

# Ver logs de um container específico
docker-compose logs -f backend

# Executar comando dentro de um container
docker-compose exec backend npm list
docker-compose exec frontend ng version
```

### Database

```bash
# Remover volume de dados (PERIGO: deleta dados)
docker-compose down -v

# Backup do banco
docker-compose exec postgres pg_dump -U lampiao lampiao_db > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U lampiao lampiao_db < backup.sql
```

## Environment Variables

Configure no arquivo `.env` (já criado):

```env
# Banco
DB_USER=lampiao
DB_PASSWORD=lampiao_dev_password  # MUDE em produção!
DB_NAME=lampiao_db

# Backend
NODE_ENV=development
API_PORT=3001
JWT_SECRET=dev_jwt_secret_change_in_production

# Frontend
FRONTEND_URL=http://localhost:4200

# Google OAuth (opcional em dev)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Troubleshooting

### Erro: "postgres is not ready"
```bash
# Aguarde mais tempo ou manualmente verifique
docker-compose logs postgres

# Se postgres não inicia, limpe volumes
docker-compose down -v
docker-compose up -d postgres
# Aguarde 10-15 segundos
docker-compose logs postgres
```

### Erro: "Cannot find module 'express'"
```bash
# Reinstale dependências
docker-compose exec backend npm ci
docker-compose exec frontend npm ci
```

### Erro: "ng: command not found"
```bash
# Frontend dependências podem não ter sido instaladas
docker-compose exec frontend npm ci
```

### Backend não recarrega após salvar código
- Verificar se volume está montado: `docker-compose exec backend ls -la src/`
- Nodemon pode precisar reiniciar: `docker-compose restart backend`
- Verificar `backend/nodemon.json`

### Frontend não mostra mudanças
- Limpar cache: `docker-compose exec frontend npx ng serve --poll=2000 --no-cache`
- Reiniciar: `docker-compose restart frontend`

### Erro de conexão com banco na primeira execução
- Migrations podem falhar se o banco não estava pronto a tempo
- Rodar manualmente: `docker-compose exec backend npm run db:migrate`
- Se persistir, reset: `docker-compose exec backend npm run db:reset`

## Estrutura de Camadas (DevOps Perspective)

```
Docker Compose (Development)
├── Service: postgres:15-alpine
│   ├── Healthcheck: pg_isready
│   ├── Port: 5432 (internal)
│   └── Volume: postgres_data (persistent)
│
├── Service: backend (Node.js)
│   ├── Build: Dockerfile.backend (multi-stage)
│   ├── Port: 3001
│   ├── Deps: postgres (healthy)
│   ├── Init: db:migrate
│   └── Volumes: src/ (hot-reload), node_modules/
│
└── Service: frontend (Angular)
    ├── Build: Dockerfile.frontend (multi-stage)
    ├── Port: 4200
    ├── Deps: backend
    └── Volumes: src/ (hot-reload), public/, node_modules/

Network: lampiao-network (bridge)
```

## Production vs Development

### Development (docker-compose.yml)
- Hot-reload habilitado (volumes)
- ng serve em vez de SSR
- npm run dev (nodemon) para backend
- Migrations automáticas

### Production (Dockerfile + Kubernetes)
- Imagens otimizadas (multi-stage)
- SSR ativado para frontend
- Node.js production mode
- Secrets via variables seguras
- Health checks para containers

## Próximos Passos

1. **Testar localmente**: `docker-compose up -d`
2. **Verificar**: http://localhost:4200
3. **Fazer commit**: Das configs de Docker
4. **Setup de CI/CD**: GitHub Actions para builds automáticos
5. **Deploy em Kubernetes** (staging/production)

## Referências

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Angular in Docker](https://angular.io/guide/build-ssr)
- [PostgreSQL in Docker](https://hub.docker.com/_/postgres)

---

**Status da Configuração**: ✅ Completo para Desenvolvimento Local
