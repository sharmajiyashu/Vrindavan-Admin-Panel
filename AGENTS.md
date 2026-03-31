# Agent instructions

When working in this repo, **always follow** the project context and conventions defined in:

**`.cursor/rules/project-context.mdc`**

That rule is always applied and covers:

- Rebuild context and reference code alignment (validators, services, types)
- Stack and conventions (Next.js App Router, React, TypeScript, Radix, Tailwind)
- Localisation (en/kh, `t()`, `getLocalizedText()` for API `{ en, kh }` text)
- Backend auth (vendor API, 401 handling)
- Performance (Server Components, lazy loading, TanStack Query, virtual lists)
- Accessibility (WCAG 2.1 AA)
- Testing and quality

Apply that rule for every change. Prefer existing validators, services, and i18n keys; do not assume reference or external code matches this codebase without checking.
