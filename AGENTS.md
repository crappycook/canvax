# Repository Guidelines

## Project Structure & Module Organization
- App entry: `src/main.tsx`; root component: `src/App.tsx`.
- Canvas and UI: `src/components/` (e.g., `Canvax.tsx`, `custom-nodes.tsx`).
- Utilities and shared types: `src/lib/` (e.g., `utils.ts`).
- Static assets: `public/` (served as-is), additional assets: `src/assets/`.
- Docs and design artifacts: `docs/` (e.g., `docs/ui-architecture.md`, `docs/figma/`).
- Path alias: import from `@/*` (configured in `tsconfig*.json`).

## Build, Test, and Development Commands
- Install deps: `pnpm install`
- Start dev server: `pnpm dev` (Vite, hot reload).
- Type check + build: `pnpm build` (TS project refs + Vite build).
- Preview production build: `pnpm preview`.
- Lint TypeScript/TSX: `pnpm lint`.

## Coding Style & Naming Conventions
- Language: TypeScript with React 19; Tailwind CSS for styling.
- Imports: prefer `@/…` alias; group std/lib/third‑party/local.
- Components: export names in PascalCase. File names may be PascalCase (e.g., `Canvax.tsx`) or kebab-case for primitives (e.g., `base-node.tsx`).
- Hooks: `useX.ts` in `src/` near usage or `src/lib` if shared.
- Utilities: colocate small helpers or place in `src/lib`. Name `*.ts`; optional types in `*.types.ts`.
- Formatting/Linting: ESLint 9 config in `eslint.config.js`; 2‑space indent; keep files strictly typed (see `tsconfig.app.json` strict flags). Use `clsx` and `tailwind-merge` with Tailwind.

## Testing Guidelines
- No test runner is configured yet. If adding tests, prefer Vitest + React Testing Library.
- Name tests `*.test.ts[x]` mirroring source folders under `src/`.
- Keep tests colocated next to components or in `src/__tests__` for integration suites.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (e.g., `feat: add canvas`, `fix: …`).
- Commits should be small and scoped; include rationale in body when non‑trivial.
- PRs must include: what/why summary, screenshots for UI changes, and links to related issues.
- Keep PRs focused; prefer follow‑ups over mixed concerns.

## Architecture Notes
- Stack: Vite + React + TypeScript + Tailwind; React Flow via `@xyflow/react`.
- Key components live in `src/components`; the canvas logic centers around `src/components/Canvax.tsx` and related node components.
