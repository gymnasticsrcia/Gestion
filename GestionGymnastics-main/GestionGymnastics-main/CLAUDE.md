# Project Rules

## Pre-completion Checklist (MANDATORY)

Before finishing **any** modification to project files, always verify:

1. **No duplicate imports** — each module is imported only once per file.
2. **No duplicate lucide-react icons** — an icon cannot be imported twice, including via aliases (e.g. `CreditCard as Edit2` AND `CreditCard` in the same import is a conflict).
3. **No duplicate variables or constants** — no two `const`/`let`/`var` declarations share the same name in the same scope.
4. **No duplicate exports** — no symbol is exported more than once from the same file.
5. **Clean build** — run `npm run build` and confirm it exits with code 0. Fix all TypeScript and compilation errors before reporting the task as done.

### Lucide-react icon rule
When aliasing an icon (e.g. `import { Pencil as Edit2 }`), do **not** also import the original name (`Pencil`) separately in the same statement or file. Use one name consistently.

### Build stability
Prioritize a clean, passing build over any other concern. A feature that compiles is always better than a feature that doesn't.
