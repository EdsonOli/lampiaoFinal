---
description: "Use when creating or modifying Angular frontend files: components, services, templates, styles, guards, interceptors, or pipes. Enforces UX-first principles: clear user flow, loading/error feedback, accessibility, and responsiveness."
applyTo: "frontend/src/**/*.{ts,html,css}"
---

# Angular Frontend UX Guidelines

## Core Principles

1. **Every async action needs three states**: loading, success, error — communicate each to the user.
2. **Flow clarity**: the user should never be left wondering what to do next or whether an action worked.
3. **Accessibility**: interactive elements need keyboard support and ARIA attributes where semantics are unclear.
4. **Responsiveness**: layouts must work on mobile-first and scale up. Never hardcode pixel widths for content areas.

## Component Structure

Prefer standalone components. Keep the template focused — extract repeated sub-structures into shared components (`shared/`).

```ts
@Component({
  standalone: true,
  selector: 'app-my-feature',
  templateUrl: './my-feature.html',
  styleUrl: './my-feature.css',
  imports: [CommonModule, RouterLink, /* ... */],
})
export class MyFeatureComponent {
  protected loading = signal(false);
  protected error = signal<string | null>(null);
}
```

## Loading & Error Feedback

Always show a loading indicator while waiting for data, and surface errors in a visible, actionable way.

```html
@if (loading()) {
  <p class="loading-state" aria-live="polite">Carregando...</p>
} @else if (error()) {
  <p class="error-state" role="alert">{{ error() }}</p>
} @else {
  <!-- main content -->
}
```

- `aria-live="polite"` for non-critical loading updates.
- `role="alert"` for error messages so screen readers announce them immediately.
- Disable submit buttons while a request is in-flight.

## Forms

- Show inline validation messages next to the affected field — not only on submit.
- Password and sensitive inputs must never be logged or echoed.
- Use `required`, `aria-required`, and `aria-describedby` on form controls.

## Navigation & Routing

- After a destructive action (delete), navigate away or reload the list with a confirmation message.
- Guard routes that require authentication using `core/guards/`.
- Use resolvers or `CanActivate` to pre-fetch data before the page renders when possible.

## Services

Services in `core/services/` communicate with the backend. They must:
- Return `Observable` or `Promise` — callers decide how to subscribe.
- Not catch errors silently — propagate them so components can show feedback.
- Map API DTOs to the frontend model types declared in `core/models/`.

## Accessibility Checklist

- `<button>` for actions, `<a>` for navigation — never the other way around.
- Images need `alt` text; decorative images use `alt=""`.
- Focus is managed after modal open/close and after route transitions.
- Colour contrast ratio ≥ 4.5:1 for body text.
