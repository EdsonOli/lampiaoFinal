# 📐 Arquitetura: Antes vs Depois

## Antes: Hardcoded MySQL (Problemático)

```
┌─────────────────────────────────────────────┐
│          Aplicação Lampião                  │
│  (Hexagonal Architecture)                   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Core (Agnóstico)                   │   │
│  │  ├── domain/                        │   │
│  │  ├── usecases/                      │   │
│  │  ├── ports/                         │   │
│  │  └── errors/                        │   │
│  └─────────────────────────────────────┘   │
│           ▲                                 │
│           │ Dependency Injection           │
│           │                                │
│  ┌─────────────────────────────────────┐   │
│  │  Adapters                           │   │
│  │  ├── repositories/                  │   │
│  │  │   └── SequelizeXxxRepository     │   │
│  │  ├── models/                        │   │
│  │  │   └── XxxModel (Sequelize)       │   │
│  │  ├── routes/                        │   │
│  │  └── config/database.ts ❌ HARDCODE │   │
│  └─────────────────────────────────────┘   │
│           ▼                                 │
└─────────────────────────────────────────────┘
           │
           │ Sequelize ORM
           │ (dialect: 'mysql') ❌ FIXO
           ▼
      ┌─────────────┐
      │   MySQL     │
      │  :3306      │
      └─────────────┘

🔴 PROBLEMA:
   - database.ts: dialect hardcoded
   - config.js: dialect hardcoded
   - Docker Compose: PostgreSQL
   → INCOMPATIBILIDADE!
```

---

## Depois: Dinâmico PostgreSQL (Correto)

```
┌─────────────────────────────────────────────┐
│          Aplicação Lampião                  │
│  (Hexagonal Architecture)                   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Core (Agnóstico)                   │   │
│  │  ├── domain/                        │   │
│  │  ├── usecases/                      │   │
│  │  ├── ports/                         │   │
│  │  └── errors/                        │   │
│  └─────────────────────────────────────┘   │
│           ▲                                 │
│           │ Dependency Injection           │
│           │                                │
│  ┌─────────────────────────────────────┐   │
│  │  Adapters                           │   │
│  │  ├── repositories/                  │   │
│  │  │   └── SequelizeXxxRepository     │   │
│  │  ├── models/                        │   │
│  │  │   └── XxxModel (Sequelize)       │   │
│  │  ├── routes/                        │   │
│  │  ├── config/database-config.ts ✅  │   │ ← NOVO Factory
│  │  │   └── getDatabaseConfig()        │   │
│  │  └── config/database.ts ✅ DINÂMICO │   │
│  └─────────────────────────────────────┘   │
│           ▼                                 │
│   Environment Variables                    │
│   ├── DB_DIALECT='postgres' ✅             │
│   ├── DB_HOST='localhost'                  │
│   ├── DB_PORT=5432                         │
│   └── DB_NAME='lampiao_db'                 │
│           ▼                                 │
└─────────────────────────────────────────────┘
           │
           │ Sequelize ORM
           │ (dialect: env.DB_DIALECT) ✅ DINÂMICO
           ▼
      ┌──────────────┐
      │ PostgreSQL   │
      │  :5432  ✅   │
      └──────────────┘

🟢 SOLUÇÃO:
   ✅ database-config.ts: centralized
   ✅ database.ts: dinâmico via factory
   ✅ config.js: dinâmico via env
   ✅ Docker Compose: PostgreSQL
   ✅ Hexagonal: intacta
```

---

## Fluxo de Dados: Antes vs Depois

### ANTES (Problemático)

```
┌─────────────────────────────────────────────┐
│ database.ts                                 │
│ ────────────────────────────────────────── │
│ const sequelize = new Sequelize(           │
│   name, user, pass,                        │
│   {                                        │
│     host: 'localhost',  ← env.DB_HOST      │
│     port: 3306,         ← HARDCODED ❌     │
│     dialect: 'mysql',   ← HARDCODED ❌     │
│   }                                        │
│ )                                          │
└─────────────────────────────────────────────┘
            ▼
   ❌ Sempre conecta MySQL
   ❌ Ignora Docker Compose PostgreSQL
   ❌ Quebra migrations
```

### DEPOIS (Correto)

```
┌──────────────────────────────────────────────┐
│ database-config.ts (NOVO)                    │
│ ───────────────────────────────────────────  │
│ export function getDatabaseConfig() {        │
│   const dialect = env.DB_DIALECT || 'postgres' │
│   return {                                   │
│     dialect,    ← DINÂMICO ✅               │
│     host: env.DB_HOST,                      │
│     port: env.DB_PORT || 5432, ← smartdefault│
│     username: env.DB_USER,                  │
│     password: env.DB_PASSWORD,              │
│     database: env.DB_NAME,                  │
│   }                                         │
│ }                                           │
└──────────────────────────────────────────────┘
            ▼
┌──────────────────────────────────────────────┐
│ database.ts (REFATORADO)                     │
│ ───────────────────────────────────────────  │
│ import { getDatabaseConfig } from ...        │
│ const config = getDatabaseConfig()           │
│ const sequelize = new Sequelize(             │
│   config.database,                           │
│   config.username,                           │
│   config.password,                           │
│   {                                          │
│     host: config.host,                       │
│     port: config.port,        ← DINÂMICO ✅ │
│     dialect: config.dialect,  ← DINÂMICO ✅ │
│   }                                          │
│ )                                            │
└──────────────────────────────────────────────┘
            ▼
   ✅ Conecta PostgreSQL (padrão)
   ✅ Respeita Docker Compose
   ✅ Migrations funcionam
```

---

## Matriz de Mudanças

### Arquivo 1: `src/config/database-config.ts` (NOVO)

```
Status: CREATE NEW FILE ✨
Size: ~80 linhas
Complexity: 🟢 Baixa
Testing: Unit test simples
Risk: 🟢 Nenhum (adiciona, não remove)
```

```typescript
import 'dotenv/config';

export type SupportedDialect = 'postgres' | 'mysql';

export interface DatabaseConfig {
  dialect: SupportedDialect;
  username: string;
  password: string;
  database: string;
  host: string;
  port: number;
  logging: boolean | ((sql: string) => void);
}

export function getDatabaseConfig(): DatabaseConfig {
  const dialect = (process.env.DB_DIALECT || 'postgres') as SupportedDialect;

  return {
    dialect,
    username: process.env.DB_USER || 'lampiao',
    password: process.env.DB_PASSWORD ||'lampiao_dev_password',
    database: process.env.DB_NAME || 'lampiao_db',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 
      (dialect === 'postgres' ? 5432 : 3306),
    logging: process.env.DB_LOG === 'true' ? console.log : false,
  };
}
```

---

### Arquivo 2: `config/database.ts` (MODIFCAR)

```
Status: REFACTOR EXISTING
Lines Changed: ~10
Complexity: 🟢 Baixa
Testing: Integration test
Risk: 🟡 Médio (ponto crítico)
Requires: Etapa 1 complete
```

**Antes** (15 linhas):
```typescript
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
  process.env.DB_NAME  || 'lampiao_api',
  process.env.DB_USER  || 'root',
  process.env.DB_PASS  || 'root',
  {
    host:    process.env.DB_HOST || '127.0.0.1',
    port:    Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',  // ← HARDCODED
    logging: false,
  }
);

export default sequelize;
```

**Depois** (16 linhas):
```typescript
import { Sequelize } from 'sequelize';
import { getDatabaseConfig } from '../src/config/database-config';

const config = getDatabaseConfig();

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,  // ← DINÂMICO
    logging: config.logging,
  }
);

export default sequelize;
```

---

### Arquivo 3: `config/config.js` (MODIFICAR)

```
Status: REFACTOR EXISTING
Lines Changed: ~20
Complexity: 🟡 Média
Testing: CLI test (sequelize-cli)
Risk: 🟡 Médio (Sequelize CLI)
Requires: Etapa 1 complete
```

**Antes** (21 linhas):
```javascript
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'lampiao_api',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',  // ← HARDCODED
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_TEST_NAME || 'lampiao_api_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',  // ← HARDCODED
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'mysql',  // ← HARDCODED
  },
};
```

**Depois** (25 linhas):
```javascript
require('dotenv').config();

const getBaseConfig = () => ({
  username: process.env.DB_USER || 'lampiao',
  password: process.env.DB_PASSWORD || 'lampiao_dev_password',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  dialect: process.env.DB_DIALECT || 'postgres',  // ← DINÂMICO
});

module.exports = {
  development: {
    ...getBaseConfig(),
    database: process.env.DB_NAME || 'lampiao_db',
  },
  test: {
    ...getBaseConfig(),
    database: process.env.DB_TEST_NAME || 'lampiao_test_db',
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: process.env.DB_DIALECT || 'postgres',  // ← DINÂMICO
  },
};
```

---

### Arquivo 4: `package.json` (MODIFICAR)

```
Status: REMOVE DEPENDENCY
Lines Changed: 2
Complexity: 🟢 Baixa
Testing: npm install/ci
Risk: 🟡 Médio (se mysql2 ainda usado)
Requires: Etapa 3 complete
```

**Antes** (com mysql2):
```json
{
  "dependencies": {
    "mysql2": "^3.9.7",  // ← REMOVER
    "pg": "^8.11.3",
    "sequelize": "^6.37.3",
    ...
  }
}
```

**Depois** (sem mysql2):
```json
{
  "dependencies": {
    "pg": "^8.11.3",  // ← MANTÉM
    "sequelize": "^6.37.3",
    ...
  }
}
```

---

### Arquivo 5: `migrations/` (VERIFICAR)

```
Status: VALIDATION & TESTING
Files: 20+ migrations
Complexity: 🟡 Média
Testing: Run all migrations
Risk: 🟠 Médio-Alto (dados!)
Requires: Etapa 4 complete
```

**Checklist por Migration**:
- [ ] `20260317155023-create-books.js` — VARCHAR, TEXT, TIMESTAMPS
- [ ] `20260319231000-create-users.js` — UUIDs, JSON columns
- [ ] ... (20+ mais migrations)
- [ ] Todas rodam sem erro em PostgreSQL
- [ ] Revertes funcionam (undo)

---

## Comparativo: Variáveis de Ambiente

### Antes (Inconsistente)
```env
# Inconsistência: PASS vs PASSWORD
DB_USER=root
DB_PASS=root          # ← Wrong name

# Hardcoded para MySQL
DB_HOST=127.0.0.1
DB_PORT=3306          # ← MySQL port

DB_NAME=lampiao_api
```

### Depois (Consistente)
```env
# Novo: Dialect explícito
DB_DIALECT=postgres         # ← Novo

# Nomes consisten
tes
DB_USER=lampiao
DB_PASSWORD=your_password   # ← Consisten name

# Valores apropriados para PostgreSQL
DB_HOST=localhost
DB_PORT=5432                # ← PostgreSQL port

DB_NAME=lampiao_db
```

---

## Checklist de Implementação Passo-a-Passo

### Phase 1: Preparação

- [ ] Ler `POSTGRES_MIGRATION_ANALYSIS.md` inteiramente
- [ ] Backup banco MySQL (se existir)
- [ ] `git status` deve estar limpo
- [ ] `npm test` passando

### Phase 2: Code Changes

- [ ] **Etapa 1**: Criar `src/config/database-config.ts`
  - [ ] Teste: `npm test -- database-config.test.ts`
  
- [ ] **Etapa 2**: Refatorar `config/database.ts`
  - [ ] Verificar import correto
  - [ ] Teste: debug log dialeto
  
- [ ] **Etapa 3**: Refatorar `config/config.js`
  - [ ] Testar Sequelize CLI: `npx sequelize-cli db:version`
  
- [ ] **Etapa 4**: Atualizar `package.json`
  - [ ] `npm install` (remove mysql2)
  - [ ] `npm ci` (verifica lock file)

### Phase 3: Testing

- [ ] **Etapa 5**: Testar Migrations
  - [ ] [ ] `npm run db:migrate`
  - [ ] Verificar schema em PostgreSQL
  - [ ] `npm run db:migrate:undo:all`

- [ ] Testes funcionam:
  - [ ] `npm test` (todos passando)
  - [ ] `npm run test:coverage`

### Phase 4: Docker

- [ ] `docker-compose down -v`
- [ ] `docker-compose build`
- [ ] `docker-compose up -d`
- [ ] Backend logs: "migrations success"
- [ ] Testar endpoints: `curl http://localhost:3001/health`

### Phase 5: Documentation

- [ ] `.env.example` atualizado
- [ ] `DOCKER_SETUP.md` refletindo PostgreSQL
- [ ] Commit message clara

---

## Rollback Plan (Se algo der errado)

```bash
# 1. Revert código
git revert <commit-hash>

# 2. Voltar para MySQL em env
export DB_DIALECT=mysql
export DB_PORT=3306

# 3. Reinstalar mysql2
npm install mysql2

# 4. Remover database-config.ts
rm src/config/database-config.ts

# 5. Restaurar backup banco
# ... (seu script de restore)
```

---

## Success Criteria ✅

- [ ] `npm run build` sem erros
- [ ] `npm test` 100% passing
- [ ] `npm run db:migrate` success
- [ ] Docker build sem erros
- [ ] `docker-compose up -d` funciona
- [ ] Endpoints respondendo (http://localhost:3001/health → 200)
- [ ] Npm warn/audit: zerado ou aceitável

---

**Próximo Passo**: Confirmar, depois iniciar Etapa 1!
