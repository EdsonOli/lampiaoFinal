---
name: "Lampiao Frontend Routing & Lazy Loading"
description: "Use when implementing, modifying, or reviewing Angular routes, lazy-loaded components, SSR server routes, component imports, and navigation paths in Lampiao frontend. Prevents routing bugs, missing routes, broken lazy loading, and inconsistent SSR configuration."
applyTo:
  - "frontend/src/app/app.routes.ts"
  - "frontend/src/app/app.routes.server.ts"
  - "frontend/src/app/pages/**/*.ts"
  - "frontend/src/app/pages/**/*.html"
  - "frontend/src/app/shared/**/*.ts"
  - "frontend/src/app/core/guards/**/*.ts"
  - "frontend/src/app/app.config.ts"
---

# Lampiao Frontend: Routing Architecture & Lazy Loading

## Regra Principal
Toda rota no Lampião **deve existir e estar totalmente configurada** nas seguintes camadas simultânea e consistentemente:
1. **app.routes.ts** — definição da rota com lazy loading do componente
2. **app.routes.server.ts** — configuração da renderização SSR (RenderMode)
3. **Componente** — must exist, be exported, and imported correctly
4. **Navegações** — todas router.navigate() e routerLink devem apontar para rotas definidas

## Arquitetura de Rotas Esperadas

### Rotas Públicas (sem authGuard)
- `''` → redireciona para `timeline` (home)
- `login` → LoginComponent (pública)
- `cadastro` → RegisterComponent (pública)
- `user/*` → aliases legadas (mantém compatibilidade com old EJS app)

### Rotas Protegidas (com authGuard)
- `timeline` → TimelineComponent (requer autenticação)
- `livros` → BookListComponent (requer autenticação)
- `livros/:id` → BookDetailComponent (rota dinâmica)
- `series` → SeriesListComponent (requer autenticação)
- `series/:seriesId` → SeriesDetailComponent (rota dinâmica)
- `perfil` → PerfilComponent (requer autenticação)
- `user/logout` → LogoutComponent (logout endpoint)

### Fallback
- `**` → redireciona para `login` (padrão)

## Checklist: Adicionando Nova Rota

Quando adicionar uma rota no frontend, **SEMPRE** execute estes passos na ordem:

### 1️⃣ Criar/Verificar o Componente
```typescript
// frontend/src/app/pages/nova-pagina/nova-pagina.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nova-pagina',
  standalone: true,
  imports: [CommonModule],  // ← OBRIGATÓRIO: standalone component
  templateUrl: './nova-pagina.component.html',
  styleUrl: './nova-pagina.component.css',
})
export class NovaPaginaComponent {}  // ← OBRIGATÓRIO: export class
```

### 2️⃣ Adicionar ao app.routes.ts
```typescript
// frontend/src/app/app.routes.ts
{
  path: 'nova-rota',  // ← caminho exato
  loadComponent: () =>
    import('./pages/nova-pagina/nova-pagina.component').then((m) => m.NovaPaginaComponent),
    // ✓ uso de lazy loading obrigatório
    // ✓ nomeclatura: ./pages/[nome-pasta]/[nome-arquivo].component.ts
    // ✓ export match: m.NovaPaginaComponent
  canActivate: [authGuard],  // ← adicionar APENAS se requer autenticação
},
```

### 3️⃣ Configurar app.routes.server.ts
```typescript
// frontend/src/app/app.routes.server.ts
{
  path: 'nova-rota',
  renderMode: RenderMode.Prerender,  // Pública
  // OU
  renderMode: RenderMode.Client,     // Dinâmica (parâmetros)
}
```

**Guia de RenderMode:**
- `Prerender` — rota estática, sem parâmetros (login, timeline, perfil)
- `Client` — rota dinâmica com parâmetros (livros/:id, series/:seriesId)

### 4️⃣ Atualizar Navegações
Se há links para esta rota:
```html
<!-- Use routerLink para navegação static -->
<a routerLink="/nova-rota">Ir para nova rota</a>

<!-- Use router.navigate() para navegação programática -->
this.router.navigate(['/nova-rota']);
this.router.navigate(['/nova-rota', { param: value }]);
```

**Validação:** Verifique se todas as ocorrências de `'/nova-rota'` em:
- `pages/**/*.html` (routerLink)
- `pages/**/*.ts` (router.navigate)
- `shared/**/*.html` (routerLink em navbar, menus)
- `shared/**/*.ts` (router.navigate em interceptors, guards)

---

## Padrões Obrigatórios

### ✅ Lazy Loading (OBRIGATÓRIO)
Toda rota **deve** usar lazy loading com `loadComponent`:
```typescript
// ✅ Correto
{
  path: 'livros',
  loadComponent: () =>
    import('./pages/book-list/book-list.component').then((m) => m.BookListComponent),
}

// ❌ ERRADO — evitar import direto
import { BookListComponent } from './pages/book-list/book-list.component';
// ...
{ path: 'livros', component: BookListComponent }
```

**Por quê?** Reduz bundle size, permite code splitting, e melhora performance de initial load.

### ✅ Standalone Components (OBRIGATÓRIO)
```typescript
@Component({
  selector: 'app-meu-componente',
  standalone: true,  // ← OBRIGATÓRIO
  imports: [CommonModule, ReactiveFormsModule],  // ← todos imports explícitos
  templateUrl: './meu-componente.component.html',
  styleUrl: './meu-componente.component.css',
})
export class MeuComponenteComponent { }  // ← OBRIGATÓRIO: class name exported
```

### ✅ authGuard para Rotas Protegidas
Qualquer rota que exija autenticação:
```typescript
{
  path: 'livros',
  loadComponent: () => import(...).then(m => m.BookListComponent),
  canActivate: [authGuard],  // ← OBRIGATÓRIO se não-pública
}
```

**Validação automática:**
```typescript
// frontend/src/app/core/guards/auth.guard.ts verifica:
if (!isPlatformBrowser(platformId)) return true;  // SSR: allow render

const user = authService.validateSession();
return user ? true : router.createUrlTree(['/login']);
```

### ✅ SSR Server Routes Config
Toda rota em `app.routes.ts` **deve ter entrada correspondente** em `app.routes.server.ts`:
```typescript
// ❌ ERRADO: falta em app.routes.server.ts
{ path: 'nova-rota', loadComponent: ... }  // definida em app.routes.ts
Resultado: SSR padrão (fallback para Prerender), comportamento inconsistente

// ✅ Correto: existe em ambos os arquivos
// app.routes.ts
{ path: 'nova-rota', loadComponent: ... }

// app.routes.server.ts
{ path: 'nova-rota', renderMode: RenderMode.Prerender }
```

---

## Validação: Checklist de Routing

Antes de fazer commit, rode estas verificações:

### 1. Coverage Check
```bash
# Verifique: toda rota em app.routes.ts está em app.routes.server.ts?
# (use busca global "path:" em ambos os arquivos)
```

### 2. Import Check
```bash
# Componente é importado via lazy loading?
# (procure por "loadComponent: () => import(...).then((m) => m.Component)")
```

### 3. Export Check
```bash
# Componente tem "export class NomeComponent"?
# (procure por "export class" perto de @Component)
```

### 4. Navigation Check
```bash
# Todas as navegações apontam para rotas que existem?
# (procure por router.navigate(['/path']) ou routerLink="/path")
# Valide contra lista em app.routes.ts
```

### 5. Guard Check
```bash
# Rotas protegidas têm canActivate: [authGuard]?
# (procure por authGuard em app.routes.ts para rotas que precisam autenticação)
```

---

## Bugs Comuns (Evite)

| Erro | Causa | Solução |
|------|-------|---------|
| **Loop infinito 302** | Rota não existe em app.routes.ts, authGuard redireciona para /login, /login também não existe | Adicione rota em ambos os arquivos |
| **Componente não carrega** | Lazy loading quebrado (typo em nome da classe, path errado) | Verifique: import path, export name, file location |
| **SSR erro "Cannot render"** | RenderMode errado ou parâmetros de rota não tratados no SSR | Rotas dinâmicas: use RenderMode.Client |
| **authGuard quebrando página** | Guard não respeita SSR (tenta acessar localStorage durante render no servidor) | Guard já tem `if (!isPlatformBrowser()) return true` |
| **routerLink dysfuncional** | Typo no path ou rota não definida em app.routes.ts | Valide contra app.routes.ts |
| **Module not found** | Componente não está na pasta correta ou não é exported | export class e standalone: true obrigatório |

---

## Exemplo: Adicionando rota "publicacoes"

Seguir exatamente nesta ordem:

### Passo 1: Criar componente
```typescript
// frontend/src/app/pages/publicacoes/publicacoes.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-publicacoes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './publicacoes.component.html',
  styleUrl: './publicacoes.component.css',
})
export class PublicacoesComponent { }
```

### Passo 2: Adicionar a app.routes.ts
```typescript
{
  path: 'publicacoes',
  loadComponent: () =>
    import('./pages/publicacoes/publicacoes.component').then((m) => m.PublicacoesComponent),
  canActivate: [authGuard],  // protegida
},
```

### Passo 3: Adicionar a app.routes.server.ts
```typescript
{
  path: 'publicacoes',
  renderMode: RenderMode.Prerender,  // estática, sem dinâmica
},
```

### Passo 4: Adicionar navegação
```html
<!-- navbar.component.html -->
<a class="nav-link" routerLink="/publicacoes" routerLinkActive="active">
  Publicações
</a>
```

Pronto! Rota completa e funcional.

---

## SSR Rendering Modes: Decisão Rápida

| Pattern | RenderMode | Razão |
|---------|-----------|-------|
| `/login`, `/cadastro` | Prerender | Páginas estáticas, sem estado |
| `/timeline`, `/livros`, `/perfil` | Prerender | Conteúdo personalizável mas estrutura fixa |
| `/livros/:id` | **Client** | Parâmetro dinâmico (cada book é diferente) |
| `/series/:seriesId` | **Client** | Parâmetro dinâmico (cada série é diferente) |
| Rotas legadas `/user/*` | Prerender | Redirecionam, estrutura fixa |
| Fallback `**` | Prerender | Catch-all para errar proteção |

**Regra simples:** Se tem `:parametro`, use `Client`. Senão, `Prerender`.

---

## Sumário: Quatro Camadas de Validação

```
┌─────────────────────────────────────────────────┐
│ 1. app.routes.ts                               │
│    - Path definido                             │
│    - Lazy loading com loadComponent()          │
│    - authGuard (se protegida)                  │
├─────────────────────────────────────────────────┤
│ 2. app.routes.server.ts                        │
│    - Path correspondente                       │
│    - RenderMode correto (Prerender vs Client)  │
├─────────────────────────────────────────────────┤
│ 3. Componente                                   │
│    - Existe em /pages/[nome]/                  │
│    - export class NomeComponent                │
│    - standalone: true                          │
│    - todos imports explícitos                  │
├─────────────────────────────────────────────────┤
│ 4. Navegações                                   │
│    - routerLink="/path" correto                │
│    - router.navigate(['/path']) correto        │
│    - nenhum typo ou path inexistente           │
└─────────────────────────────────────────────────┘
```

Se uma camada falha → **toda a rota falha** (404, loop, componente não carrega).

---

## O que Evitar

❌ Definir rota em `app.routes.ts` mas esquecer `app.routes.server.ts`  
❌ Usar `RenderMode.Prerender` para rota com `:parametro`  
❌ Componente não-export ou não-standalone  
❌ Usar `import { Component } from './pages/...';` no lugar de lazy loading  
❌ Routes.ts com typo que não corresponde a app.routes.server.ts  
❌ Navegações para /caminho-que-nao-existe  
❌ authGuard sem `isPlatformBrowser` check (quebra SSR)
