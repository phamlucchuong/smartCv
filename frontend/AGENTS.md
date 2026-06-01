# Repository Guidelines

## Project Structure & Module Organization
This repository is a `pnpm` monorepo.
- `apps/web-candidate`, `apps/web-recruiter`, `apps/web-admin`: Vite + React applications.
- `packages/ui`: shared UI components and styles (`src/components/ui`, `src/globals.css`).
- `packages/i18n`: shared localization setup and locale JSON files (`src/locales/en`, `src/locales/vi`).
- `packages/api`: generated API client and Axios setup (`orval.config.ts`, `src/axios-instance.ts`).
- `docs/`: project documentation.

Keep app-specific features inside each app; move reusable code into `packages/*`.

## Build, Test, and Development Commands
Run commands from repository root unless noted.
- `pnpm install`: install all workspace dependencies.
- `pnpm dev`: run all apps in parallel.
- `pnpm -F web-candidate dev`: run one app only (replace filter as needed).
- `pnpm build`: build all workspaces.
- `pnpm lint`: run ESLint across workspaces.
- `pnpm generate:api`: regenerate API client via Orval (`@smart-cv/api`).
- `pnpm -F web-admin preview`: preview a production build for one app.

## Coding Style & Naming Conventions
- Language: TypeScript (`.ts`, `.tsx`) with React function components.
- Indentation: 2 spaces; keep imports grouped and unused imports removed.
- Components: `PascalCase` filenames and exports (for example, `UserCard.tsx`).
- Hooks/stores/utilities: `camelCase` (for example, `useCandidateStore.ts`).
- Routes in `web-candidate/src/routes`: use file-based TanStack Router naming (for example, `signin.tsx`, `__root.tsx`).
- Linting: ESLint 10 + `typescript-eslint` + `react-hooks` (`pnpm lint`).

## Testing Guidelines
There is currently no dedicated test runner configured in workspace scripts. Until tests are added:
- Validate changes with `pnpm lint` and app-level build commands (for example, `pnpm -F web-candidate build`).
- For feature work, include manual verification steps in your PR.
- If adding tests, prefer Vitest + React Testing Library and colocate as `*.test.ts(x)` near source files.

## Commit & Pull Request Guidelines
Git history uses Conventional Commits (for example, `feat: add sign-in page ...`).
- Commit format: `type(scope): summary` where possible (`feat`, `fix`, `refactor`, `chore`).
- Keep commits focused and buildable.
- PRs should include: clear description, linked issue/task, affected app/package list, and UI screenshots for visual changes.
- Before opening PR: run `pnpm lint`, `pnpm build`, and regenerate API artifacts if contracts changed.
