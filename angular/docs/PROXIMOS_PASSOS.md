# 🚀 Guia de Próximos Passos - Lampião ABP

Este documento guia você pelos próximos passos para finalizar o projeto Lampião e colocá-lo em produção.

---

## 📋 Índice
1. [Testes Locais](#1-testes-locais)
2. [Configuração do Backend](#2-configuração-do-backend)
3. [Integração Frontend-Backend](#3-integração-frontend-backend)
4. [Melhorias Opcionais](#4-melhorias-opcionais)
5. [Preparação para Produção](#5-preparação-para-produção)
6. [Checklist de Deploy](#6-checklist-de-deploy)

---

## 1. Testes Locais

### 1.1 Verificar Instalação do Frontend

```bash
cd /home/avanade/lampiao-abp/angular

# Verificar se npm install terminou
npm list --depth=0

# Se houver erros, reinstalar
rm -rf node_modules package-lock.json
npm install

# Tentar compilar
npm run build
```

### 1.2 Rodar Frontend em Desenvolvimento

```bash
# Ainda no diretório angular/
npm start

# Acessar: http://localhost:4200
# Deve abrir a aplicação ABP com login
```

### 1.3 Verificar Erros de Compilação

```bash
# Verificar todos os arquivos TypeScript
npx tsc --noEmit

# Se houver erros, listar:
npx tsc --listFiles | grep "error"
```

**Erros comuns esperados:**
- ❌ `configState is not defined` no timeline.component.html → Injetar no construtor
- ❌ Imports faltando → Adicionar nos imports do componente
- ✅ Erros de `Cannot find module '@angular/core'` devem sumir após npm install

---

## 2. Configuração do Backend

### 2.1 Criar Migrations do Entity Framework

```bash
cd /home/avanade/lampiao-abp/aspnet-core/src/Lampiao.EntityFrameworkCore

# Criar migration inicial
dotnet ef migrations add InitialLampiaoEntities

# Verificar se a migration foi criada
ls Migrations/
```

**Esperado:** Arquivo `YYYYMMDDHHMMSS_InitialLampiaoEntities.cs` criado

### 2.2 Configurar Connection String MySQL

Editar `/home/avanade/lampiao-abp/aspnet-core/src/Lampiao.DbMigrator/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "Default": "Server=localhost;Port=3306;Database=LampiaoDb;Uid=root;Pwd=SUA_SENHA;"
  }
}
```

**Substituir:**
- `localhost` → IP do seu MySQL
- `SUA_SENHA` → Senha real do MySQL root

### 2.3 Criar Database

```bash
cd /home/avanade/lampiao-abp/aspnet-core/src/Lampiao.DbMigrator

# Executar migrator
dotnet run

# Deve aparecer:
# ✅ "Successfully migrated to LampiaoDb"
# ✅ "Successfully seeded initial data"
```

### 2.4 Verificar Database Criado

```bash
# Conectar ao MySQL
mysql -u root -p

# Usar database
USE LampiaoDb;

# Listar tabelas (deve ter 20+)
SHOW TABLES;

# Verificar algumas tabelas específicas
DESCRIBE Books;
DESCRIBE UserBooks;
DESCRIBE Posts;
DESCRIBE Comments;

# Sair
EXIT;
```

### 2.5 Rodar Backend em Desenvolvimento

```bash
cd /home/avanade/lampiao-abp/aspnet-core/src/Lampiao.HttpApi.Host

# Rodar API
dotnet run

# Deve iniciar em:
# https://localhost:44321
# http://localhost:4000
```

**Testar Swagger:**
- Abrir: https://localhost:44321/swagger
- Deve listar todos os endpoints (Books, UserBooks, Posts, Comments)

---

## 3. Integração Frontend-Backend

### 3.1 Configurar URLs no Frontend

Editar `/home/avanade/lampiao-abp/angular/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  application: {
    baseUrl: 'http://localhost:4200',
    name: 'Lampião',
  },
  oAuthConfig: {
    issuer: 'https://localhost:44321',
    clientId: 'Lampiao_App',
    responseType: 'code',
    scope: 'offline_access Lampiao',
  },
  apis: {
    default: {
      url: 'https://localhost:44321',
      rootNamespace: 'Lampiao',
    },
  },
};
```

### 3.2 Testar Login

1. **Rodar backend e frontend simultaneamente**
   ```bash
   # Terminal 1: Backend
   cd aspnet-core/src/Lampiao.HttpApi.Host
   dotnet run
   
   # Terminal 2: Frontend
   cd angular
   npm start
   ```

2. **Acessar http://localhost:4200**

3. **Fazer login com:**
   - Username: `admin`
   - Password: `1q2w3E*` (padrão ABP)

4. **Verificar se login funciona**
   - Deve redirecionar para home
   - Menu deve mostrar "Olá, admin"

### 3.3 Testar Fluxo Completo

#### Teste 1: Catálogo de Livros
1. Navegar para `/books`
2. **Verificar:** Lista vazia ou com livros de seed
3. Se vazio: Adicionar livro via Swagger ou criar componente admin

#### Teste 2: Adicionar à Biblioteca
1. Clicar em um livro → Ver detalhes
2. Clicar "Adicionar à Biblioteca"
3. Escolher status: "Reading"
4. **Verificar:** Botão muda para "Gerenciar"
5. Navegar para `/library`
6. **Verificar:** Livro aparece na biblioteca

#### Teste 3: Criar Resenha
1. Navegar para `/social`
2. Clicar "Nova Resenha"
3. Preencher:
   - Título: "Excelente livro!"
   - Conteúdo: "Este livro mudou minha vida..."
   - Selecionar livro (opcional)
   - Marcar "Público"
4. Clicar "Publicar"
5. **Verificar:** Redireciona para detalhes do post
6. Voltar para timeline → Post deve aparecer

#### Teste 4: Comentar
1. Abrir um post
2. Escrever comentário
3. Clicar "Comentar"
4. **Verificar:** Comentário aparece
5. Clicar "Responder" no comentário
6. **Verificar:** Resposta aninhada aparece

#### Teste 5: Perfil
1. Navegar para `/profile/me`
2. **Verificar:** Estatísticas aparecem
3. **Verificar:** Posts recentes aparecem
4. Clicar "Editar Perfil"
5. Alterar bio
6. Salvar
7. **Verificar:** Mudanças refletidas

---

## 4. Melhorias Opcionais

### 4.1 Shared Components (Recomendado)

**BookCardComponent** - Card reutilizável
```bash
# Criar componente
cd /home/avanade/lampiao-abp/angular/src/app/shared/components
mkdir book-card
cd book-card

# Usar schematic do Angular
npx ng generate component book-card --standalone --skip-tests
```

**RatingStarsComponent** - Estrelas reutilizáveis
```typescript
// rating-stars.component.ts
@Component({
  selector: 'app-rating-stars',
  standalone: true,
  template: `
    <div class="rating-stars">
      @for (star of [1,2,3,4,5]; track star) {
        <i class="bi" 
           [class.bi-star-fill]="star <= rating()"
           [class.bi-star]="star > rating()"
           (click)="onClick(star)"></i>
      }
    </div>
  `
})
export class RatingStarsComponent {
  rating = input.required<number>();
  readonly = input<boolean>(false);
  ratingChange = output<number>();

  onClick(star: number) {
    if (!this.readonly()) {
      this.ratingChange.emit(star);
    }
  }
}
```

### 4.2 Toast Notifications (Recomendado)

Instalar biblioteca:
```bash
cd /home/avanade/lampiao-abp/angular
npm install ngx-toastr
npm install @angular/animations
```

Configurar em `app.config.ts`:
```typescript
import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... outros providers
    provideAnimations(),
    provideToastr({
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    })
  ]
};
```

Usar nos componentes:
```typescript
import { ToastrService } from 'ngx-toastr';

constructor(private toastr: ToastrService) {}

salvar() {
  this.service.save().subscribe({
    next: () => this.toastr.success('Salvo com sucesso!'),
    error: () => this.toastr.error('Erro ao salvar')
  });
}
```

### 4.3 Debounce em Buscas (Recomendado)

```typescript
// Em book-list.component.ts
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';

searchSubject = new Subject<string>();

ngOnInit() {
  this.searchSubject.pipe(
    debounceTime(300),
    distinctUntilChanged()
  ).subscribe(query => {
    this.filter.filter = query;
    this.loadBooks();
  });
}

onSearchChange(event: Event) {
  const query = (event.target as HTMLInputElement).value;
  this.searchSubject.next(query);
}
```

### 4.4 Image Upload (Necessário para ProfileEdit)

**Backend:** Criar endpoint de upload

```csharp
// ProfileAppService.cs
[HttpPost]
[Route("upload-image")]
public async Task<string> UploadProfileImage(IFormFile file)
{
    // Validar arquivo
    if (file == null || file.Length == 0)
        throw new UserFriendlyException("Arquivo inválido");

    // Validar tipo
    if (!file.ContentType.StartsWith("image/"))
        throw new UserFriendlyException("Apenas imagens são permitidas");

    // Salvar em wwwroot/images/profiles/
    var fileName = $"{CurrentUser.Id}_{Guid.NewGuid()}.jpg";
    var path = Path.Combine("wwwroot", "images", "profiles", fileName);
    
    Directory.CreateDirectory(Path.GetDirectoryName(path));
    
    using (var stream = new FileStream(path, FileMode.Create))
    {
        await file.CopyToAsync(stream);
    }
    
    return $"/images/profiles/{fileName}";
}
```

**Frontend:** Atualizar ProfileEditComponent

```typescript
// profile-edit.component.ts
onFileSelected(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  // TODO: Criar ProfileService com método uploadImage
  this.profileService.uploadImage(formData).subscribe({
    next: (url) => {
      this.previewImage.set(url);
      this.profileForm.patchValue({ profileImageUrl: url });
    }
  });
}
```

---

## 5. Preparação para Produção

### 5.1 Build de Produção

#### Backend
```bash
cd /home/avanade/lampiao-abp/aspnet-core/src/Lampiao.HttpApi.Host

# Build em modo Release
dotnet publish -c Release -o ./publish

# Resultado em: ./publish/
```

#### Frontend
```bash
cd /home/avanade/lampiao-abp/angular

# Build otimizado
npm run build:prod

# Resultado em: dist/Lampiao/
```

### 5.2 Configurar Ambientes

**Backend - appsettings.Production.json**
```json
{
  "ConnectionStrings": {
    "Default": "Server=prod-server;Database=LampiaoDb;..."
  },
  "App": {
    "CorsOrigins": "https://lampiao.com.br,https://www.lampiao.com.br"
  },
  "AuthServer": {
    "Authority": "https://api.lampiao.com.br"
  }
}
```

**Frontend - environment.prod.ts**
```typescript
export const environment = {
  production: true,
  application: {
    baseUrl: 'https://lampiao.com.br',
    name: 'Lampião',
  },
  oAuthConfig: {
    issuer: 'https://api.lampiao.com.br',
    clientId: 'Lampiao_App',
    responseType: 'code',
    scope: 'offline_access Lampiao',
  },
  apis: {
    default: {
      url: 'https://api.lampiao.com.br',
      rootNamespace: 'Lampiao',
    },
  },
};
```

### 5.3 Otimizações

#### Frontend
- ✅ Lazy loading já configurado
- ✅ Standalone components (bundle menor)
- ⚙️ Adicionar service workers (PWA)
- ⚙️ Preload strategy para rotas críticas
- ⚙️ Image optimization (WebP, lazy loading)

#### Backend
- ⚙️ Response caching
- ⚙️ Redis para sessions
- ⚙️ CDN para assets
- ⚙️ Compression (Gzip/Brotli)

---

## 6. Checklist de Deploy

### Infraestrutura
- [ ] Servidor Linux/Windows provisionado
- [ ] MySQL 8.0+ instalado
- [ ] .NET 8 Runtime instalado
- [ ] Nginx/Apache configurado
- [ ] SSL/TLS certificado instalado (Let's Encrypt)
- [ ] Firewall configurado (portas 80, 443, 3306)

### Backend
- [ ] Build de produção gerado
- [ ] Connection string configurada
- [ ] CORS origins configurados
- [ ] Migrations executadas
- [ ] Seed de dados executado
- [ ] Logs configurados (Serilog/NLog)
- [ ] Health checks configurados

### Frontend
- [ ] Build de produção gerado
- [ ] Ambiente de produção configurado
- [ ] Deploy no servidor (Nginx/Vercel/Netlify)
- [ ] Redirect HTTP → HTTPS
- [ ] Cache headers configurados
- [ ] Error tracking (Sentry/AppInsights)

### Database
- [ ] Backup configurado (diário)
- [ ] Índices criados (performance)
- [ ] Usuário dedicado (não root)
- [ ] SSL/TLS habilitado
- [ ] Monitoring configurado

### Segurança
- [ ] HTTPS everywhere
- [ ] JWT secrets em variáveis de ambiente
- [ ] Database password em secrets
- [ ] Rate limiting configurado
- [ ] OWASP Top 10 verificado

### Monitoring
- [ ] Application Insights / Elastic APM
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Performance monitoring
- [ ] Log aggregation (ELK/Seq)

---

## 🎯 Resumo das Prioridades

### 🔥 Crítico (Fazer Primeiro)
1. ✅ Criar migrations EF Core
2. ✅ Configurar connection string MySQL
3. ✅ Executar DbMigrator
4. ✅ Testar backend via Swagger
5. ✅ Testar frontend integrado

### ⚙️ Importante (Segunda Etapa)
6. Implementar upload de imagens
7. Criar seed de livros iniciais
8. Adicionar toast notifications
9. Implementar debounce em buscas
10. Testes E2E básicos

### 💎 Opcional (Melhorias)
11. Shared components reutilizáveis
12. PWA com service workers
13. Dark mode
14. Infinite scroll
15. Testes unitários completos

---

## 📞 Suporte

Se encontrar problemas:

1. **Verificar logs:**
   - Backend: `logs/` na pasta do HttpApi.Host
   - Frontend: Console do navegador (F12)

2. **Comandos úteis de debug:**
   ```bash
   # Backend - Ver logs em tempo real
   tail -f aspnet-core/src/Lampiao.HttpApi.Host/logs/logs.txt
   
   # Frontend - Build com source maps
   npm run build -- --source-map
   ```

3. **Issues comuns:**
   - CORS error → Verificar `CorsOrigins` no appsettings
   - 401 Unauthorized → Verificar `Authority` no environment
   - 404 Not Found → Verificar rotas no `app.routes.ts`
   - Database connection failed → Verificar MySQL rodando

---

**Boa sorte com o deploy! 🚀**

---

**Documento criado por:** GitHub Copilot  
**Data:** Janeiro 2025  
**Projeto:** Lampião ABP - Rede Social Literária
