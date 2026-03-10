# 🎨 Arquitetura Frontend - Lampião Angular

## 📁 Estrutura de Pastas

```
angular/src/app/
├── core/                           # Serviços e recursos singleton
│   ├── guards/                     # Guardas de rota
│   ├── interceptors/               # Interceptadores HTTP
│   └── services/                   # Serviços globais
│
├── features/                       # Módulos de funcionalidade (Feature Modules)
│   ├── books/                      # 📚 Catálogo de Livros
│   │   ├── components/
│   │   │   ├── book-list/          # Lista de livros com filtros
│   │   │   └── book-detail/        # Detalhes do livro + ações
│   │   ├── services/
│   │   │   └── book.service.ts     # API calls para livros
│   │   ├── models/
│   │   │   └── book.model.ts       # DTOs e interfaces
│   │   └── books.routes.ts         # Rotas lazy-loaded
│   │
│   ├── library/                    # 📖 Biblioteca Pessoal
│   │   ├── components/
│   │   │   ├── library-list/       # Biblioteca do usuário
│   │   │   └── library-statistics/ # Estatísticas de leitura
│   │   ├── services/
│   │   │   └── user-book.service.ts
│   │   ├── models/
│   │   │   └── user-book.model.ts  # ReadingStatus enum, DTOs
│   │   └── library.routes.ts
│   │
│   ├── social/                     # 🌐 Timeline e Posts
│   │   ├── components/
│   │   │   ├── timeline/           # Feed de posts
│   │   │   ├── post-detail/        # Post individual + comentários
│   │   │   └── post-form/          # Criar/editar post
│   │   ├── services/
│   │   │   ├── post.service.ts
│   │   │   └── comment.service.ts
│   │   ├── models/
│   │   │   └── post.model.ts       # PostDto, CommentDto
│   │   └── social.routes.ts
│   │
│   └── profile/                    # 👤 Perfil de Usuário
│       ├── components/
│       │   ├── profile-view/       # Visualizar perfil
│       │   └── profile-edit/       # Editar perfil
│       ├── services/
│       ├── models/
│       │   └── profile.model.ts
│       └── profile.routes.ts
│
├── shared/                         # Componentes e recursos compartilhados
│   ├── components/                 # Componentes reutilizáveis
│   ├── directives/                 # Diretivas customizadas
│   ├── pipes/                      # Pipes customizados
│   └── models/
│       └── page-request.model.ts   # Modelos genéricos (paginação)
│
├── home/                           # Página inicial
├── app.routes.ts                   # Rotas principais
└── app.component.ts                # Componente raiz
```

---

## 🏗️ Padrões de Arquitetura Utilizados

### 1. **Feature-Based Architecture**
Organização por funcionalidade ao invés de tipo técnico.

**Benefícios:**
- ✅ Fácil de escalar
- ✅ Clara separação de responsabilidades
- ✅ Permite trabalho em paralelo por equipes
- ✅ Facilita remoção/adição de features

### 2. **Standalone Components (Angular 17+)**
Todos os componentes são independentes, sem necessidade de NgModules.

```typescript
@Component({
  selector: 'app-book-list',
  standalone: true,  // ← Componente standalone
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './book-list.component.html',
  styleUrl: './book-list.component.scss'
})
export class BookListComponent { }
```

**Vantagens:**
- ✅ Imports explícitos (menos "magic")
- ✅ Tree-shaking melhorado
- ✅ Lazy loading simplificado
- ✅ Menos boilerplate

### 3. **Lazy Loading por Feature**
Cada feature é carregada sob demanda.

```typescript
// app.routes.ts
{
  path: 'books',
  loadChildren: () => import('./features/books/books.routes').then(m => m.booksRoutes)
}
```

**Performance:**
- ⚡ Bundle inicial menor
- ⚡ Carregamento progressivo
- ⚡ Melhor First Contentful Paint (FCP)

### 4. **Signals (Angular 16+)**
Estado reativo com signals ao invés de RxJS observables onde apropriado.

```typescript
export class BookListComponent {
  books = signal<BookDto[]>([]);     // ← Signal
  loading = signal(false);
  totalCount = signal(0);
  
  loadBooks(): void {
    this.loading.set(true);           // ← Set value
    // ...
  }
}
```

```html
@if (loading()) {                   <!-- ← Read signal -->
  <spinner />
}
```

**Benefícios:**
- ✅ Detecção de mudanças mais eficiente
- ✅ Código mais simples (sem subscribe/unsubscribe)
- ✅ Melhor performance

### 5. **Smart vs Presentation Components**

#### Smart Components (Container)
- Conectam-se aos serviços
- Gerenciam estado
- Contêm lógica de negócio

```typescript
// book-list.component.ts (Smart)
export class BookListComponent {
  constructor(private bookService: BookService) {}
  
  loadBooks(): void {
    this.bookService.getList(this.filter).subscribe(...)
  }
}
```

#### Presentation Components (Dumb)
- Apenas recebem dados via `@Input()`
- Emitem eventos via `@Output()`
- Não conhecem serviços
- Reutilizáveis

```typescript
// book-card.component.ts (Presentation)
export class BookCardComponent {
  @Input() book!: BookDto;
  @Output() addToLibrary = new EventEmitter<string>();
}
```

---

## 🔄 Fluxo de Dados

```
Component → Service → RestService (ABP) → Backend API
    ↓                                          ↓
  Signal                                   Response
    ↓                                          ↓
 Template ←──────────────────────────────────┘
```

### Exemplo Completo:

```typescript
// 1. Service faz requisição HTTP
@Injectable({ providedIn: 'root' })
export class BookService {
  getList(input: GetBooksInput): Observable<PagedResponse<BookDto>> {
    return this.restService.request(...);
  }
}

// 2. Component usa service e armazena em signal
export class BookListComponent {
  books = signal<BookDto[]>([]);
  
  loadBooks(): void {
    this.bookService.getList(this.filter).subscribe({
      next: (response) => this.books.set(response.items)
    });
  }
}

// 3. Template renderiza dados do signal
```html
@for (book of books(); track book.id) {
  <app-book-card [book]="book" />
}
```

---

## 🎨 Padrões de UI Utilizados

### 1. **Bootstrap 5 + Bootstrap Icons**
Framework CSS para layout responsivo.

```html
<div class="container py-4">
  <div class="row g-4">
    <div class="col-md-4">...</div>
  </div>
</div>
```

### 2. **Grid Responsivo**
Layout adaptável para diferentes telas.

```html
<div class="col-6 col-md-4 col-lg-3 col-xl-2">
  <!-- 
    Mobile: 2 colunas
    Tablet: 3 colunas
    Desktop: 4 colunas
    Large: 6 colunas
  -->
</div>
```

### 3. **Control Flow Syntax (Angular 17+)**
Nova sintaxe para controle de fluxo.

```html
<!-- Antes (antigo) -->
<div *ngIf="loading">...</div>
<div *ngFor="let book of books">...</div>

<!-- Agora (novo) -->
@if (loading()) {
  <spinner />
}
@for (book of books(); track book.id) {
  <book-card [book]="book" />
}
```

**Vantagens:**
- ✅ Melhor performance
- ✅ Syntax highlighting melhorado
- ✅ Type checking mais forte
- ✅ Menos erros em runtime

---

## 📊 Gerenciamento de Estado

### Estratégia Atual: **Component State com Signals**

```typescript
export class BookListComponent {
  // Estado local do componente
  books = signal<BookDto[]>([]);
  loading = signal(false);
  filter = { /* ... */ };
  
  loadBooks(): void {
    this.loading.set(true);
    this.bookService.getList(this.filter).subscribe({
      next: (data) => {
        this.books.set(data.items);
        this.loading.set(false);
      }
    });
  }
}
```

### Para Futuro (se necessário): **NgRx ou Akita**
Considerar quando:
- Estado compartilhado entre múltiplos components distantes
- Necessidade de time-travel debugging
- Regras de negócio complexas

---

## 🔐 Autenticação e Autorização

### ABP Authentication
Gerenciado automaticamente pelo ABP Framework.

```typescript
// Proteger rota
{
  path: 'library',
  canActivate: [authGuard],  // ← Guard do ABP
  loadChildren: () => import('./features/library/library.routes')
}

// Verificar autenticação no component
export class BookDetailComponent {
  isAuthenticated = signal(false);
  
  constructor(private configState: ConfigStateService) {}
  
  ngOnInit(): void {
    this.isAuthenticated.set(
      this.configState.getOne('currentUser')?.isAuthenticated ?? false
    );
  }
}
```

```html
@if (isAuthenticated()) {
  <button>Adicionar à Biblioteca</button>
}
```

---

## 🚀 Performance e Otimizações

### 1. **Lazy Loading**
✅ Implementado em todas as features

### 2. **TrackBy em Loops**
```html
@for (book of books(); track book.id) {  <!-- ← track by ID -->
  <book-card [book]="book" />
}
```

### 3. **OnPush Change Detection**
Considerar para components presentation:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

### 4. **Image Lazy Loading**
```html
<img [src]="book.imageUrl" loading="lazy" />
```

---

## 📝 Convenções de Código

### Nomenclatura

```
Components:  book-list.component.ts
Services:    book.service.ts
Models:      book.model.ts
Routes:      books.routes.ts
Guards:      auth.guard.ts
Pipes:       format-date.pipe.ts
Directives:  highlight.directive.ts
```

### Estrutura de Component

```typescript
@Component({ /* ... */ })
export class BookListComponent implements OnInit {
  // 1. Signals e variáveis públicas
  books = signal<BookDto[]>([]);
  loading = signal(false);
  
  // 2. Variáveis privadas
  private subscription?: Subscription;
  
  // 3. Constructor
  constructor(private bookService: BookService) {}
  
  // 4. Lifecycle hooks
  ngOnInit(): void { }
  ngOnDestroy(): void { }
  
  // 5. Métodos públicos
  loadBooks(): void { }
  onSearch(query: string): void { }
  
  // 6. Métodos privados
  private transformData(): void { }
  
  // 7. Getters e setters
  get currentPage(): number { return /* ... */; }
}
```

---

## ✅ Próximos Passos

### Componentes Faltando:

1. **Social (Timeline)**
   - `timeline.component.ts` - Feed de posts
   - `post-detail.component.ts` - Post individual
   - `post-form.component.ts` - Criar/editar post
   - `comment-list.component.ts` - Lista de comentários

2. **Profile**
   - `profile-view.component.ts` - Visualizar perfil
   - `profile-edit.component.ts` - Editar perfil

3. **Shared Components**
   - `book-card.component.ts` - Card reutilizável de livro
   - `loading-spinner.component.ts` - Spinner customizado
   - `rating-stars.component.ts` - Componente de avaliação

### Melhorias:

- [ ] Implementar paginação real (atualmente hardcoded)
- [ ] Adicionar debounce na busca
- [ ] Toast notifications (sucesso/erro)
- [ ] Skeleton loaders
- [ ] Infinite scroll (alternativa à paginação)
- [ ] PWA (Progressive Web App)
- [ ] Testes unitários (Karma/Jest)
- [ ] E2E tests (Cypress/Playwright)

---

## 🛠️ Comandos Úteis

```bash
# Instalar dependências
cd angular
npm install

# Desenvolvimento
npm start                    # http://localhost:4200

# Build de produção
npm run build:prod

# Testes
npm test                     # Unit tests
npm run test:coverage        # Coverage report

# Lint
npm run lint

# Gerar component
ng g c features/books/components/book-card --standalone

# Gerar service
ng g s features/books/services/book-search

# Gerar guard
ng g guard core/guards/admin --functional
```

---

## 📚 Referências

- [Angular Official Docs](https://angular.dev/)
- [ABP Angular UI](https://docs.abp.io/en/abp/latest/UI/Angular/Component-Replacement)
- [Angular Signals](https://angular.dev/guide/signals)
- [Bootstrap 5](https://getbootstrap.com/docs/5.3/)
- [RxJS](https://rxjs.dev/)

---

**Última atualização:** Março 2026  
**Angular Version:** 21.0.0  
**ABP Version:** 10.1.1
