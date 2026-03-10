# Lampiao ABP — Guia de Continuação

## O que foi implementado

### Arquitetura: Monólito Modular (caminho natural para Microsserviços)

```
lampiao-abp/aspnet-core/src/
├── Lampiao.Domain.Shared/
│   ├── Books/BookConsts.cs           ← limites de tamanho de campos
│   ├── UserBooks/ReadingStatus.cs    ← enum: WantToRead | Reading | Read
│   ├── Posts/PostConsts.cs
│   ├── Posts/CommentConsts.cs
│   └── LampiaoDomainErrorCodes.cs   ← códigos de erro de negócio
│
├── Lampiao.Domain/                   ← DDD puro, sem dependências de infra
│   ├── Books/
│   │   ├── Book.cs                  ← Aggregate Root (catálogo de livros)
│   │   └── BookManager.cs           ← Domain Service (invariantes)
│   ├── UserBooks/
│   │   ├── UserBook.cs              ← Aggregate Root (biblioteca pessoal)
│   │   └── UserBookManager.cs       ← valida status/nota
│   ├── Posts/
│   │   ├── Post.cs                  ← Aggregate Root (resenhas/posts)
│   │   ├── Comment.cs               ← Aggregate Root independente
│   │   └── PostManager.cs
│   └── Users/
│       └── UserProfile.cs           ← foto de perfil (separado do IdentityUser)
│
├── Lampiao.Application.Contracts/   ← DTOs + interfaces (contrato público da API)
│   ├── Books/  BookDto | CreateUpdateBookDto | GetBooksInput | IBookAppService
│   ├── UserBooks/  UserBookDto | AddToLibraryDto | UpdateUserBookDto | IUserBookAppService
│   ├── Posts/  PostDto | CommentDto | CreatePostDto | IPostAppService | ICommentAppService
│   └── Permissions/  LampiaoPermissions (Books/UserBooks/Posts/Comments)
│
├── Lampiao.Application/             ← Implementação dos AppServices
│   ├── Books/BookAppService.cs      ← CRUD + top-rated + most-favorited + latest
│   ├── UserBooks/UserBookAppService.cs
│   └── Posts/PostAppService.cs + CommentAppService.cs
│
├── Lampiao.EntityFrameworkCore/
│   └── LampiaoEntityTypeConfiguration.cs  ← config EF Core (índices, constraints)
│   └── LampiaoDbContext.cs                 ← DbSets adicionados
│
└── Lampiao.HttpApi/
    └── Controllers/
        ├── Books/BookController.cs
        ├── UserBooks/UserBookController.cs
        └── Posts/PostController.cs + CommentController.cs
```

---

## Mapeamento MVP → ABP

| MVP (lampiaoFinal) | ABP (lampiao-abp) |
|---|---|
| `models/User.js` | `IdentityUser` (ABP) + `UserProfile` |
| `models/Book.js` | `Domain/Books/Book.cs` |
| `models/Notebook.js` | `Domain/UserBooks/UserBook.cs` |
| `models/Post.js` | `Domain/Posts/Post.cs` |
| `models/Comment.js` | `Domain/Posts/Comment.cs` |
| Sessão HTTP + bcrypt | OpenIddict (OAuth2/OIDC) — já configurado pelo ABP |
| `GET /books` | `GET /api/app/books` |
| `GET /books` (mais favoritados) | `GET /api/app/books/most-favorited` |
| `GET /books` (mais bem avaliados) | `GET /api/app/books/top-rated` |
| `GET /timeline` | `GET /api/app/posts/timeline` |
| `GET /notebooks` | `GET /api/app/user-books/my-library` |

---

## Próximos Passos (por prioridade)

### 1. Criar a Migration EF Core

```bash
# Na pasta aspnet-core/
dotnet ef migrations add InitialLampiaoEntities \
    --project src/Lampiao.EntityFrameworkCore \
    --startup-project src/Lampiao.DbMigrator
```

### 2. Configurar o DbMigrator

Adicionar seed de permissões padrão em `LampiaoDbMigratorModule.cs` para que
usuários autenticados recebam automaticamente as permissões:
- `Lampiao.Posts.Create`
- `Lampiao.Posts.Edit`
- `Lampiao.Posts.Delete`
- `Lampiao.Comments.*`
- `Lampiao.UserBooks`

### 3. Configurar AutoMapper

Criar `LampiaoApplicationAutoMapperProfile.cs` em `Lampiao.Application/`:

```csharp
using AutoMapper;
using Lampiao.Books;
using Lampiao.Posts;
using Lampiao.UserBooks;
using Lampiao.Users;

namespace Lampiao;

public class LampiaoApplicationAutoMapperProfile : Profile
{
    public LampiaoApplicationAutoMapperProfile()
    {
        CreateMap<Book, BookDto>();
        CreateMap<UserBook, UserBookDto>();
        CreateMap<Post, PostDto>();
        CreateMap<Comment, CommentDto>();
    }
}
```

E registrar em `LampiaoApplicationModule.cs`:
```csharp
Configure<AbpAutoMapperOptions>(options =>
{
    options.AddMaps<LampiaoApplicationModule>();
});
```

### 4. Frontend Angular

Os endpoints seguem o padrão ABP, então o Angular pode usar o ABP HTTP Proxy
para gerar serviços TypeScript automaticamente:

```bash
abp generate-proxy -t ng --url https://localhost:44316
```

Isso gera em `angular/src/app/proxy/`:
- `books/book.service.ts`
- `user-books/user-book.service.ts`
- `posts/post.service.ts`

### 5. Funcionalidades a evoluir no projeto

| Feature | Status | Notas |
|---|---|---|
| Imagem de capa de livro | Parcial | `ImageUrl` existe, falta upload (use ABP BlobStoring) |
| Foto de perfil | Parcial | `UserProfile.ProfileImageUrl` existe, falta upload |
| Sugestões de livros (algoritmo) | Não iniciado | Candidato a microsserviço futuro |
| Notificações | Não iniciado | ABP tem módulo de notificações integrado |
| Feed personalizado | Não iniciado | Baseado em livros lidos + usuários seguidos |
| Seguir usuários | Não iniciado | Relacionamento social básico |

---

## Caminho para Microsserviços (quando necessário)

A estrutura atual usa bounded contexts claramente separados por namespace:

```
Lampiao.Books    → futuro microsserviço BookCatalog
Lampiao.UserBooks → futuro microsserviço ReadingDiary
Lampiao.Posts    → futuro microsserviço Social
```

Quando o volume justificar:
1. Extrair cada namespace para um `AbpModule` próprio com seu `DbContext` isolado
2. Trocar chamadas diretas por mensageria (ABP Event Bus → RabbitMQ)
3. O ABP Microservices Starter já oferece o scaffolding necessário

**Não é necessário mudar o código de negócio** — apenas a infraestrutura de comunicação.
