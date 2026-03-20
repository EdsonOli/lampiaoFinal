# Guia de Migração UUID para Lampião Backend

This guide walks through converting all database tables from INTEGER auto-increment primary keys to UUID.

## Status Atual

✅ **Implementação concluída em código:**
- Domain models: IDs já usam `string`
- Sequelize models: Configurados com `DataTypes.UUID` e `UUIDV4`
- Repositórios: Trabalham com `string` para IDs
- Migrações: 5 migrações de conversão criadas

⏳ **Pendente:** Executar migrações no banco de dados

## Estrutura das Migrações UUID

| Arquivo | Ordem | Ação |
|---------|-------|------|
| 20260320000000-convert-to-uuid-books.js | 5/5 | Drop comments, notebooks, posts, users, books. Recriar books com UUID |
| 20260320000100-convert-to-uuid-users.js | 1/5 | Recriar users com UUID |
| 20260320000200-convert-to-uuid-posts.js | 2/5 | Recriar posts com UUID + FKs |
| 20260320000300-convert-to-uuid-notebooks.js | 3/5 | Recriar notebooks com UUID + FKs |
| 20260320000400-convert-to-uuid-comments.js | 4/5 | Recriar comments com UUID + FKs |

**Nota:** As migrações usam um padrão destrutivo (DROP TABLE + CREATE TABLE) porque você aprovou apagar dados existentes.

## Pré-requisitos

1. **Docker/MySQL rodando** com credenciais:
   - Host: `127.0.0.1` (ou conforme `.env`)
   - Port: `3306`
   - Database: `lampiao_api`
   - User: `root`
   - Password: (conforme `.env`)

2. **Backend compilado:**
   ```bash
   cd backend
   npm run build
   ```

3. **.env configurado** (ou variáveis de ambiente):
   ```
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=lampiao_api
   DB_USER=root
   DB_PASS=capibaed  # ajustar conforme seu ambiente
   ```

## Passo 1: Backup (Recomendado)

Se houver dados no banco que você quer preservar em outro lugar:

```bash
# Terminal PowerShell no diretório backend/
mysqldump -h 127.0.0.1 -u root -pcapibaed lampiao_api > backup_pre_uuid.sql
```

**Armazenar backup com segurança** (contém dados sensíveis de usuário/password com hash).

## Passo 2: Desvincular Migrações Antigas (Opcional mas Recomendado)

Se o banco já tem as migrações antigas executadas, você pode:

**Opção A: Undoing tudo (mais seguro se houver dados que importam)**
```bash
npm run db:migrate:undo:all
```

Isso vai executar o `down` de TODAS as migrações em ordem reversa, deletando as tabelas e recriando o schema vazio.

**Opção B: Deixar as migrações antigas registradas**
As novas migrações UUID vão droppar as tabelas antigas e recriá-las. O JSON `SequelizeMeta` no banco vai conter AMBAS (antigas + novas).

Nós preferimos **Opção A** para limpeza.

## Passo 3: Executar Migrações UUID

```bash
npm run db:migrate
```

Isso vai:
1. Ler todo arquivo em `migrations/`
2. Comparar com registros de `SequelizeMeta` no banco
3. Executar apenas migrações não registradas
4. Registrar cada uma em `SequelizeMeta`

**Saída esperada:**
```
Executing migration: 20260320000000-convert-to-uuid-books.js
Executing migration: 20260320000100-convert-to-uuid-users.js
Executing migration: 20260320000200-convert-to-uuid-posts.js
Executing migration: 20260320000300-convert-to-uuid-notebooks.js
Executing migration: 20260320000400-convert-to-uuid-comments.js
✓ All migrations applied successfully
```

## Passo 4: Verificar Estrutura do Banco

```bash
# Via MySQL CLI
mysql -h 127.0.0.1 -u root -pcapibaed lampiao_api

# Verificar se as tabelas foram recriadas
DESCRIBE users;
DESCRIBE books;
DESCRIBE posts;
DESCRIBE notebooks;
DESCRIBE comments;

# Todas devem ter `id` como `CHAR(36) UUID PRIMARY KEY`
```

Esperado para coluna `id`:
```
Field | Type      | Null | Key | Default | Extra
id    | char(36)  | NO   | PRI | NULL    |       
```

## Passo 5: Seed (Opcional)

Se quiser popular o banco novamente com dados de teste:

```bash
npm run db:seed  # se houver seeders em seeders/
```

OU execute manualmente:
```bash
npm run seed:up:initial-books
```

## Passo 6: Validar com Backend Rodando

```bash
# Terminal 1: Roda o backend
npm start
# Esperado: "Server listening on http://0.0.0.0:3000" (ou similar)

# Terminal 2: Testar um endpoint
curl -X GET http://localhost:3000/api/books

# Deve retornar [] ou lista de livros (dependendo se foi feito seed)
```

## Rollback (Se Necessário)

Se something der errado:

```bash
# Ver histórico de migrações
npm run db:migrate:status

# Desfazer última migração
npm run db:migrate:undo

# Desfazer TUDO (volta ao zero)
npm run db:migrate:undo:all

# E depois restaurar do backup (se tiver)
mysql -h 127.0.0.1 -u root -pcapibaed lampiao_api < backup_pre_uuid.sql
```

## Troubleshooting

### Erro: "Table 'lampiao_api.SequelizeMeta' doesn't exist"
- Primeiro `npm run db:migrate` cria essa tabela. Se não existir, o DB está vazio.
- Solução: Rodar `npm run db:migrate` uma vez.

### Erro: "Access denied for user 'root'"
- Verificar credenciais em `.env` ou variáveis de ambiente
- Testar conexão manualmente: `mysql -h 127.0.0.1 -u root -p<password> -e "SELECT 1;"`

### Erro: "Connection timeout"
- Garantir que MySQL está rodando
- Docker: `docker ps | grep mysql` deve mostrar container ativo
- Local: `netstat -an | findstr 3306` (PowerShell) deve mostrar LISTENING

### Erro: "Foreign key constraint fails"
- Improável com as nossas migrações (usam DROP + CREATE)
- Mas se acontecer: Desabilitar FK temporariamente no MySQL:
  ```sql
  SET FOREIGN_KEY_CHECKS=0;
  -- rodar migração
  SET FOREIGN_KEY_CHECKS=1;
  ```

## Próximos Passos

Após sucesso:
1. **Testar fluxos críticos** (cadastro, login, criar post, etc.)
2. **Verificar logs** de backend para warnings/errors
3. **Atualizar aplicação frontend** se houver queries que dependam de formato de ID (normalmente não há, UUID é string mesmo)
4. **CI/CD**: Se houver pipeline, incluir migrations como parte do deploy

## Documentação de Referência

- Sequelize Migrations: https://sequelize.org/docs/v6/other-topics/migrations/
- MySQL UUID: https://dev.mysql.com/doc/refman/8.0/en/miscellaneous-functions.html#function_uuid
- UUID vs INT: UUID é mais seguro (não enumerable), melhor para distribuição (no-central-counter), mas ocupa mais espaço (36 bytes vs 4 bytes)
