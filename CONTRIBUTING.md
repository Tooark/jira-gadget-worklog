# Contributing to Worklog Chart Gadget

First off, thank you for considering contributing to the **Worklog Chart
Gadget**! 🎉

This repository hosts an [Atlassian Forge](https://developer.atlassian.com/platform/forge/)
dashboard gadget for Jira that aggregates and visualizes worklog time per user,
with interactive drill-down charts. This document explains how to propose
changes, report bugs, and submit code.

## Table of contents

- [Ways to contribute](#ways-to-contribute)
- [Repository layout](#repository-layout)
- [Development workflow](#development-workflow)
- [Commit convention](#commit-convention)
- [Coding standards](#coding-standards)
- [Deploying and releasing](#deploying-and-releasing)
- [Pull Request checklist](#pull-request-checklist)
- [Community](#community)

---

## Ways to contribute

- 🐛 **Report bugs** — open an issue with the `bug` template.
- ✨ **Suggest features** — open an issue with the `feature` template.
- 📖 **Improve documentation** — the README and code docs are first-class.
- 💻 **Write code** — pick an issue labeled `good first issue` or `help wanted`.

---

## Repository layout

This is an **npm workspaces** project. The workspaces live under `src/`:

| Path           | Workspace  | Purpose                                                   |
| -------------- | ---------- | --------------------------------------------------------- |
| `src/frontend` | `frontend` | React UI (Vite + Atlaskit + ECharts): `Edit` and `View`   |
| `src/backend`  | `backend`  | Forge resolver: worklog aggregation and Jira REST queries |
| `src/static`   | —          | Static assets (gadget icon/thumbnail)                     |
| `manifest.yml` | —          | Forge app manifest (modules, permissions, scopes)         |

---

## Development workflow

**Prerequisites:** Node.js 20.x (see `.nvmrc`; 22.x and 24.x also work) and the
Forge CLI. See the [README](README.md) for the full first-time Forge setup
(API token, `forge login`, `forge register`, `forge install`).

1. **Fork** the repository and clone your fork.
2. Install dependencies from the repo root (covers all workspaces):

   ```sh
   npm install
   ```

3. Create a feature branch: `git checkout -b feat/short-description`.
4. Make your changes with clear, small commits.
5. Run the checks from the repo root:

   ```sh
   npm run lint   # ESLint + build + forge lint
   npm run build  # Vite build of the frontend
   npm test       # Jest tests with coverage (CI mode)
   ```

6. Push and open a Pull Request against `main`.

> Tip: for live development against a real Jira site, run `npx forge tunnel`
> in one terminal and (optionally) `npm start` inside `src/frontend` in
> another. `npm test` inside `src/frontend` runs Jest in watch mode.

---

## Commit convention

We use [**Conventional Commits**](https://www.conventionalcommits.org/),
validated by [commitlint](.commitlintrc.json)
(`@commitlint/config-conventional`).

Format:

```text
<type>(<scope>): <short summary>
```

Allowed types:

| Type       | Purpose                                                 |
| ---------- | ------------------------------------------------------- |
| `feat`     | New feature                                             |
| `fix`      | Bug fix                                                 |
| `docs`     | Documentation only                                      |
| `style`    | Formatting (no code change)                             |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                                 |
| `test`     | Adding or fixing tests                                  |
| `build`    | Build system or dependencies                            |
| `ci`       | CI configuration                                        |
| `chore`    | Other changes not affecting src or tests                |
| `revert`   | Reverts a previous commit                               |

Use the affected area as the scope when it applies:

```text
feat(frontend): add weekly grouping option to the chart
fix(backend): paginate worklog search past 100 issues
docs(readme): document the jql filter field
```

---

## Coding standards

- **TypeScript** in the frontend (`tsc --noEmit` via `npm run lint:tsc`).
- **ESLint + Prettier** via the flat config (`eslint.config.mjs`). Run
  `npm run lint` before pushing; `npm run lint:fix` auto-fixes.
- **Jest + Testing Library** for tests. New or changed behavior needs tests;
  UI changes should keep coverage green (`npm test`).
- **Forge manifest** changes (`manifest.yml`) must pass `npm run lint:forge`.
  Adding **scopes or permissions** requires explicit maintainer review — they
  trigger admin re-consent on every installed site.

---

## Deploying and releasing

Deploys are performed by maintainers with the Forge CLI (contributors do not
need deploy rights — a PR is enough):

| Command               | Environment                                 |
| --------------------- | ------------------------------------------- |
| `npm run deploy`      | development (default)                       |
| `npm run deploy-hml`  | staging                                     |
| `npm run deploy-prd`  | production                                  |
| `npm run deploy-test` | build → tests → deploy → upgrade (pipeline) |

Version bumps follow the `version` field in the root `package.json`.

---

## Pull Request checklist

Before opening a PR, confirm:

- [ ] Commits follow Conventional Commits
- [ ] `npm run lint`, `npm run build`, and `npm test` pass locally
- [ ] Tests cover the change
- [ ] Documentation is updated (README) when behavior changes
- [ ] `manifest.yml` changes (if any) are called out in the PR description
- [ ] PR title follows Conventional Commits
- [ ] Linked to at least one issue (`Closes #123`)

---

## Community

- 💬 [GitHub Discussions](https://github.com/Tooark/jira-gadget-worklog/discussions)
- 🐛 [Issues](https://github.com/Tooark/jira-gadget-worklog/issues)
- 🌐 [Tooark](https://tooark.com)

Thank you for making the Worklog Chart Gadget better! 💙
