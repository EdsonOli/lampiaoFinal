# 🎯 Sumário Executivo: Migração MySQL → PostgreSQL

## Problema
Lampião possui **hardcoding MySQL** em dois arquivos críticos:
- `config/database.ts` (Sequelize connection)
- `config/config.js` (Sequelize CLI)

Mas Docker Compose já usa **PostgreSQL**. Isso cria **falha na migração de banco**.

## Solução: 5 Etapas Estruturadas

### Etapa 1: Criar Abstração de Dialect ⚙️
**Novo arquivo**: `src/config/database-config.ts`
- Factory que retorna config dinâmica
- Suporta MySQL e PostgreSQL
- Resolve de env vars com fallbacks

```typescript
export function getDatabaseConfig(): DatabaseConfig {
  const dialect = process.env.DB_DIALECT || 'postgres';
  return { dialect, host, port, ... };
}
```

### Etapa 2: Atualizar Sequelize Connection 🔗
**Modificar**: `config/database.ts`
- Remover hardcoding `dialect: 'mysql'`
- Usar `getDatabaseConfig()` factory
- Resultado: agnóstico de dialect

### Etapa 3: Atualizar Sequelize CLI 🛠️
**Modificar**: `config/config.js`
- Remover hardcoding `dialect: 'mysql'`
- Usar env var `DB_DIALECT`
- Fallback para PostgreSQL

### Etapa 4: Atualizar Dependências 📦
**Modificar**: `package.json`
- Remove: `mysql2` (não precisa mais)
- Mantém: `pg` (PostgreSQL)
- Mantém: `sequelize`

### Etapa 5: Validar Migrations ✅
**Verificar**: `migrations/`
- Todas as migrations rodarem em PostgreSQL
- Compatibilidade de tipos SQL
- Reversibilidade (undo)

---

## Diferenças: MySQL vs PostgreSQL

### Dialects Suportados
```javascript
// ANTES (hardcoded)
dialect: 'mysql'           // Única opção

// DEPOIS (dinâmico)
dialect: process.env.DB_DIALECT || 'postgres'  // Flexível
```

### Variáveis de Environment

| Var | Antes (MySQL) | Depois (PostgreSQL) |
|----|---|---|
| `DB_DIALECT` | ❌ Não existe | ✅ `postgres` |
| `DB_PORT` | `3306` | `5432` |
| `DB_USER` | `root` | `lampiao` |
| `DB_PASSWORD` | `root` | `lampiao_pwd` |

### Dependências

| Package | Antes | Depois | Motivo |
|---------|-------|--------|--------|
| `mysql2` | ✅ Instalado | ❌ Removido | PostgreSQL nativo (`pg`) |
| `sequelize` | ✅ Instalado | ✅ Instalado | ORM agnóstico |
| `pg` | ❌ Faltava | ✅ Instalado | Driver PostgreSQL |

---

## Por que PostgreSQL?

### Vantagens para Docker/Containers

| Aspecto | MySQL | PostgreSQL | Vencedor |
|--------|-------|-----------|---------|
| **Build nativo** | Requer `g++`, `python` | Sem dependencies externas | 🟢 PostgreSQL |
| **Imagem Docker** | ~500MB | ~350MB | 🟢 PostgreSQL |
| **Velocidade build** | 3-5 min | 1-2 min | 🟢 PostgreSQL |
| **Type Safety** | Limitado | UUID, JSON, Arrays | 🟢 PostgreSQL |
| **Escalabilidade** | Boa | Excelente | 🟢 PostgreSQL |
| **Padrão em Node.js** | Menos comum | De facto padrão | 🟢 PostgreSQL |

### Compatibilidade com Sequelize

Sequelize **abstrai** maioria das diferenças:
- ✅ DataTypes.STRING, DataTypes.UUID, DataTypes.BOOLEAN → automático
- ✅ Migrations com `queryInterface` → agnóstico
- ✅ Models com `sequelize.define()` → agnóstico
- ✅ Relationships (hasMany, belongsTo) → agnóstico

---

## Arquitetura Hexagonal: Preservação

Esta migração **NÃO afeta**:
- ✅ Domain (core/domain) — zero dependencies
- ✅ Use Cases (core/usecases) — agnóstico
- ✅ Ports (core/ports) — interfaces, não implementação
- ✅ Controllers/Routes — HTTP apenas

Esta migração **SIM afeta**:
- 🔄 Adapters (repositories) — mas implementa interface
- 🔄 Config (database.ts) — detalhes de infraestrutura
- 🔄 Migrations — SQL (mas compatível)

**Resultado**: ✅ Arquitetura hexagonal **intacta**

---

## Riscos e Mitigação

| Risco | Severidade | Mitigação |
|-------|-----------|-----------|
| Migrations falharem em PostgreSQL | 🔴 Alto | Etapa 5: validação completa |
| Revert difícil | 🟡 Médio | Backup database antes |
| Incompatibilidade SQL | 🟡 Médio | Sequelize abstrai maioria |
| Breaking change para dev local | 🟡 Médio | .env.example com novos values |

---

## Roadmap de Implementação

```
Day 1:
  ✅ Criar database-config.ts (30 min)
  ✅ Refatorar database.ts (20 min)
  ✅ Refatorar config.js (20 min)

Day 2:
  ✅ Update package.json (10 min)
  ✅ npm install (5 min)
  ✅ Testar migrations (1-2 h)
  ✅ Docker Compose build + up (30 min)
  ✅ Testes e4validação final (1 h)

Total: 4-5 horas de trabalho
```

---

## Checklist Pré-Início

- [ ] Backup do banco MySQL atual (se existe)
- [ ] Git branch limpo (`git status` = clean)
- [ ] Ler `POSTGRES_MIGRATION_ANALYSIS.md` completo
- [ ] PostgreSQL 15+ disponível localmente (ou Docker)
- [ ] Testes unitários passando

---

## Benefícios Pós-Migração

✅ **Docker Compose consistente** — backend + frontend + postgres  
✅ **Builds mais rápidos** — sem compilação de mysql2  
✅ **Imagens menores** — menos dependências  
✅ **Production-ready** — PostgreSQL padrão em produção  
✅ **Escalável** — melhor para transactions e concorrência  
✅ **Type-safe** — DataTypes.UUID, DataTypes.JSON nativo  
✅ **DevOps padronizado** — mesma stack desenvolvimento/staging/production  

---

## Próximas Ações

1. **Revisar análise completa** → `POSTGRES_MIGRATION_ANALYSIS.md`
2. **Confirmar com team** → "Ok para proceder?"
3. **Iniciar Etapa 1** → criar `database-config.ts`
4. **Executar sequencialmente** → Etapas 2-5 com testes
5. **Validar em Docker** → `docker-compose up -d`
6. **Commit & push** → mensagens claras do que mudou

---

## Referências

- [Sequelize Docs - Dialects](https://sequelize.org/docs/v6/other-topics/connections/#dialect)
- [PostgreSQL vs MySQL](https://www.postgresql.org/about/featurematrix/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

---

**Versão**: 1.0  
**Data**: 21 de março de 2026  
**Status**: 🟢 Pronto para Implementação
