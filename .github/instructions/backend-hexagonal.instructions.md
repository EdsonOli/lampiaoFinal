---
description: "Use when creating or modifying backend TypeScript files: use cases, ports, repositories, adapters, routes, middlewares, error types, or validation schemas. Enforces hexagonal architecture boundaries, DI via Container, Zod validation, and structured error codes."
applyTo: "backend/src/**/*.ts"
---

# Backend Hexagonal Architecture

## Layer Boundaries

The backend is strictly divided into two layers. Cross-layer dependency must always flow inward (adapters → core), never outward.

| Layer | Path | Rule |
|-------|------|------|
| Domain | `core/domain/` | Pure TS interfaces/types. Zero imports from `adapters/` or `config/`. |
| Ports | `core/ports/` | Repository and service interfaces only. No implementation details. |
| Use cases | `core/usecases/` | Receive dependencies via constructor. Never import from `adapters/`. |
| Errors | `core/errors/` | Extend `AppError`. Declare `statusCode` + optional `code`. |
| Repositories | `adapters/repositories/` | Implement port interfaces (e.g., `implements UserRepository`). |
| Services | `adapters/services/` | Implement port interfaces (e.g., `implements PasswordHasher`). |
| Routes | `adapters/routes/` | Only consume `Container.useCases`. Never instantiate use cases directly. |

## Adding a New Use Case

1. Define inputs/outputs as interfaces in the same file as the class.
2. Constructor receives only port interfaces as parameters.
3. Implement a single `execute(...)` method.
4. Register in `adapters/container/useCaseFactory.ts` and in the `UseCases` return type.

```ts
// core/usecases/DoSomething.ts
import { SomeRepository } from '../ports/SomeRepository';
import { NotFoundError } from '../errors';

export class DoSomething {
  constructor(private readonly repo: SomeRepository) {}
  async execute(id: string): Promise<Something> { ... }
}
```

## Adding a New Error Type

Extend `AppError`, add to `core/errors/index.ts`, and register a matching code in `adapters/http/errorCatalog.ts`.

```ts
export class MyDomainError extends AppError {
  readonly statusCode = 422;
  readonly code = 'MY_DOMAIN_ERROR';
  readonly message: string;
  constructor(message = 'Default message') {
    super(message);
    this.message = message;
    Object.setPrototypeOf(this, MyDomainError.prototype);
  }
}
```

## Route Conventions

- All user input validated with `parseOrThrow(schema, req.body)` before reaching a use case.
- All free-text user input sanitized with helpers from `validation/sanitizers.ts`.
- All error responses use helpers from `http/respondError.ts` with a typed `ApiErrorCode`.
- New error codes must be added to `http/errorCatalog.ts` before use.
- Sensitive operations must call `auditLog(event, details)`.

```ts
// Route handler pattern
router.post('/', authenticate, async (req, res, next) => {
  try {
    const payload = parseOrThrow(mySchema, req.body);
    const result = await myUseCase.execute({ text: sanitizePlainText(payload.text) });
    await auditLog('entity.created', { entityId: result.id, userId: req.auth?.userId });
    res.status(201).json(result);
  } catch (error) {
    if (isValidationError(error)) return validationError(res, getValidationMessage(error), 'MY_INVALID_PAYLOAD');
    next(error);
  }
});
```

## Sequelize Repository Pattern

- Map DB model fields → domain interface in a private `map*(model)` function.
- Never return a Sequelize model instance from a repository method — always map to domain type.

```ts
function mapUser(user: UserModel): User {
  return { id: user.id, name: user.name, email: user.email, /* ... */ };
}
```
