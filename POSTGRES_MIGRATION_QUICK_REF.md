# ⚡ Quick Reference: Migração MySQL → PostgreSQL

## 3-Segundo Summary
**Problema**: Sequelize hardcoded pra MySQL, Docker usa PostgreSQL  
**Solução**: Criar factory dinâmica, remover hardcodes  
**Tempo**: 4-5 horas  
**Risco**: Média (é refactor lower-level)  

---

## File-by-File Changes

### 📁 NEW: `backend/src/config/database-config.ts`

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
    password: process.env.DB_PASSWORD || 'lampiao_dev_password',
    database: process.env.DB_NAME || 'lampiao_db',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || (dialect === 'postgres' ? 5432 : 3306),
    logging: process.env.DB_LOG === 'true' ? console.log : false,
  };
}
```

---

### 📝 MODIFY: `backend/config/database.ts`

**Change**: Usar `getDatabaseConfig()` factory

```diff
- import { Sequelize } from 'sequelize';
+ import { Sequelize } from 'sequelize';
+ import { getDatabaseConfig } from '../src/config/database-config';

- const sequelize = new Sequelize(
-   process.env.DB_NAME  || 'lampiao_api',
-   process.env.DB_USER  || 'root',
-   process.env.DB_PASS  || 'root',
-   {
-     host:    process.env.DB_HOST || '127.0.0.1',
-     port:    Number(process.env.DB_PORT) || 3306,
-     dialect: 'mysql',
-     logging: false,
-   }
- );

+ const config = getDatabaseConfig();
+ const sequelize = new Sequelize(
+   config.database,
+   config.username,
+   config.password,
+   {
+     host: config.host,
+     port: config.port,
+     dialect: config.dialect,
+     logging: config.logging,
+   }
+ );
```

---

### 📝 MODIFY: `backend/config/config.js`

**Change**: Remover hardcoding MySQL, usar env vars

```diff
require('dotenv').config();

+ const getBaseConfig = () => ({
+   username: process.env.DB_USER || 'lampiao',
+   password: process.env.DB_PASSWORD || 'lampiao_dev_password',
+   host: process.env.DB_HOST || 'localhost',
+   port: Number(process.env.DB_PORT) || 5432,
+   dialect: process.env.DB_DIALECT || 'postgres',
+ });

module.exports = {
-   development: {
-     username: process.env.DB_USER || 'root',
-     password: process.env.DB_PASS || '',
-     database: process.env.DB_NAME || 'lampiao_api',
-     host: process.env.DB_HOST || '127.0.0.1',
-     port: Number(process.env.DB_PORT) || 3306,
-     dialect: 'mysql',
-   },
+   development: {
+     ...getBaseConfig(),
+     database: process.env.DB_NAME || 'lampiao_db',
+   },

-   test: {
-     username: process.env.DB_USER || 'root',
-     password: process.env.DB_PASS || '',
-     database: process.env.DB_TEST_NAME || 'lampiao_api_test',
-     host: process.env.DB_HOST || '127.0.0.1',
-     port: Number(process.env.DB_PORT) || 3306,
-     dialect: 'mysql',
-   },
+   test: {
+     ...getBaseConfig(),
+     database: process.env.DB_TEST_NAME || 'lampiao_test_db',
+   },

    production: {
      use_env_variable: 'DATABASE_URL',
-     dialect: 'mysql',
+     dialect: process.env.DB_DIALECT || 'postgres',
    },
};
```

---

### 📦 MODIFY: `backend/package.json`

**Change**: Remover `mysql2`, manter `pg`

```diff
  "dependencies": {
-   "mysql2": "^3.9.7",
    "pg": "^8.11.3",
    "sequelize": "^6.37.3",
    ...
  }
```

**Command**:
```bash
npm remove mysql2
npm install
```

---

### 📋 VERIFY: `backend/migrations/*.js`

**Action**: Rodar todas as migrations em PostgreSQL

```bash
# Setup test database
docker run --name test-postgres \
  -e POSTGRES_PASSWORD=test \
  -d postgres:15

docker exec test-postgres psql -U postgres \
  -c "CREATE DATABASE lampiao_test;"

# Run migrations
NODE_ENV=test \
DB_DIALECT=postgres \
DB_HOST=localhost \
DB_PORT=5432 \
DB_USER=postgres \
DB_PASSWORD=test \
DB_NAME=lampiao_test \
  npx sequelize-cli db:migrate

# Cleanup
docker stop test-postgres
docker rm test-postgres
```

---

## Environment Variables: Update

### `.env` (Local Development)

```diff
- DB_USER=root
- DB_PASS=root
- DB_PORT=3306
+ DB_DIALECT=postgres
+ DB_USER=lampiao
+ DB_PASSWORD=lampiao_dev_password
+ DB_PORT=5432
- DB_NAME=lampiao_api
+ DB_NAME=lampiao_db
```

### `.env.example` (Template)

```bash
# Core
NODE_ENV=development

# Database
DB_DIALECT=postgres              # ← NEW
DB_HOST=localhost
DB_PORT=5432                     # ← Changed
DB_USER=lampiao                  # ← Changed
DB_PASSWORD=your_password        # ← Renamed
DB_NAME=lampiao_db               # ← Changed

# API
API_PORT=3001
API_URL=http://localhost:3001

# Frontend
FRONTEND_URL=http://localhost:4200
```

---

## Testing & Validation

### Unit Test

**File**: `backend/src/__tests__/config/database-config.test.ts`

```typescript
import { getDatabaseConfig } from '../../src/config/database-config';

describe('getDatabaseConfig', () => {
  beforeEach(() => {
    delete process.env.DB_DIALECT;
    delete process.env.DB_PORT;
  });

  it('should return postgres config by default', () => {
    const config = getDatabaseConfig();
    expect(config.dialect).toBe('postgres');
    expect(config.port).toBe(5432);
  });

  it('should return mysql config when DB_DIALECT=mysql', () => {
    process.env.DB_DIALECT = 'mysql';
    const config = getDatabaseConfig();
    expect(config.dialect).toBe('mysql');
    expect(config.port).toBe(3306);
  });

  it('should use custom port when DB_PORT set', () => {
    process.env.DB_PORT = '9999';
    const config = getDatabaseConfig();
    expect(config.port).toBe(9999);
  });
});
```

**Run**:
```bash
npm test -- database-config.test.ts
```

### Integration Test

```bash
# Test Sequelize CLI
npx sequelize-cli db:version

# Should output: Sequelize CLI [Node: 18.x, CLI: 6.6.x, ORM: 6.37.x]
```

### Docker Test

```bash
# Kill old containers
docker-compose down

# Rebuild with new config
docker-compose up -d

# Check backend logs
docker-compose logs backend | grep -E "running|error|migrations"

# Test API health
curl http://localhost:3001/health
# Expected: {"status":"OK","service":"lampiao-api"}
```

---

## Rollback Commands (If Needed)

```bash
# Revert git changes
git revert --no-edit <commit-hash>

# Restore mysql2
npm install mysql2

# Restore database-config.ts
git restore src/config/database-config.ts

# Set MySQL env vars back
export DB_DIALECT=mysql
export DB_PORT=3306
```

---

## Execution Checklist

- [ ] **Pre-Start**
  - [ ] `git status` clean
  - [ ] `npm test` passing
  - [ ] `.env` backed up

- [ ] **Etapa 1**: Create database-config.ts
  - [ ] File created
  - [ ] `npm test -- database-config.test.ts` passing
  - [ ] `git commit -m "feat: add database config factory"`

- [ ] **Etapa 2**: Refactor config/database.ts
  - [ ] Hardcoding removed
  - [ ] Uses `getDatabaseConfig()`
  - [ ] `npm run build` succeeds
  - [ ] `git commit -m "refactor: use dynamic database config"`

- [ ] **Etapa 3**: Refactor config/config.js
  - [ ] Hardcoding removed
  - [ ] Uses env variables
  - [ ] `npx sequelize-cli db:version` works
  - [ ] `git commit -m "refactor: use dynamic sequelize cli config"`

- [ ] **Etapa 4**: Update package.json
  - [ ] `npm remove mysql2`
  - [ ] `npm install pg`
  - [ ] `npm ci` successful
  - [ ] `git commit -m "chore: remove mysql2, ensure pg available"`

- [ ] **Etapa 5**: Test Migrations
  - [ ] `npx sequelize-cli db:migrate` succeeds
  - [ ] `npx sequelize-cli db:migrate:undo:all` succeeds
  - [ ] No errors in database schema
  - [ ] `git commit -m "test: verify migrations work with postgresql"`

- [ ] **Docker**
  - [ ] `docker-compose build` succeeds
  - [ ] `docker-compose up -d` all healthy
  - [ ] `curl http://localhost:3001/health` → 200
  - [ ] `git push`

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| `Cannot find module 'database-config'` | Verificar path import: `../src/config/database-config` |
| `npx sequelize-cli db:migrate` fails | Verificar `DB_DIALECT` set em `.env` |
| Docker PostgreSQL não inicia | Aguardar 15-20 seg, postgres leva tempo |
| Migrations quebram com errros SQL | Rodar em shell PostgreSQL, verificar tipos |
| `mysql2` still required somewhere | Grep para `mysql2` ou `require('mysql')` |

---

## Visual Summary

```
┌─────────────────────────────────────────┐
│        5 Etapas Sequenciais            │
├─────────────────────────────────────────┤
│ 1️⃣  Criar database-config.ts (NEW)     │
│ 2️⃣  Refatorar config/database.ts       │
│ 3️⃣  Refatorar config/config.js         │
│ 4️⃣  Update package.json                │
│ 5️⃣  Testar migrations                  │
├─────────────────────────────────────────┤
│ ⏱️  Tempo Total: 4-5 horas             │
│ 📊 Risco: Médio                        │
│ ✅ Benefício: Alta (Docker compatible) │
└─────────────────────────────────────────┘
```

---

## FAQ

**P: Por que não simplesmente trocar MySQL por PostgreSQL?**  
R: Já fizemos! Mas estava hardcoded. Agora é dinâmico.

**P: Pode reverter para MySQL depois?**  
R: Sim! Basta `DB_DIALECT=mysql` em `.env`.

**P: Vai quebrar meu código?**  
R: Não! Core/domain intactos. Só adapters mudam.

**P: Vale a pena fazer isso?**  
R: Sim! ImagensDockermenores, builds rápidas, PostgreSQL padrão.

**P: Quanto tempo leva?**  
R: 4-5 horas, maioria é testing.

---

## Next Steps

1. **Ler documentação**:
   - `POSTGRES_MIGRATION_SUMMARY.md` ← Overview
   - `POSTGRES_MIGRATION_ANALYSIS.md` ← Detalhado
   - `POSTGRES_MIGRATION_VISUAL.md` ← Arquitetura

2. **Confirmar com team**: "Ok para proceder?"

3. **Iniciar Etapa 1**: Criar `database-config.ts`

4. **Testar constantemente**: Cada etapa tem teste

5. **Commit com mensagens claras**

---

**Last Updated**: 21 de março de 2026  
**Status**: 🟢 Pronto para Começar
