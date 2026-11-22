# HW4 Part 1: Claude Code project setup log

Annotated record of how the Claude Code setup was built. Screenshots go in `docs/hw4/screenshots/`.

## 1. Scaffold and tooling

- Scaffolded Next.js 16 (App Router, TypeScript, Tailwind, ESLint).
- Added Vitest, coverage, Playwright, Prettier, and fast-check, plus `test`, `typecheck`, `format`, and `test:e2e` scripts.
- Commits: `chore: scaffold Next.js app ...`, `chore: add test, format and typecheck tooling`.

## 2. Supporting docs written before /init

- `docs/PRD.md`: problem, roles, user stories, testable acceptance criteria, security criteria.
- `docs/architecture.md`: ADRs (stack, pure scheduler module, layering, server-side authz, reschedules as proposals, deterministic generation).
- `docs/testing.md`: test pyramid, TDD rules, property tests, coverage target.
- `docs/context-management.md`: when we use `/clear`, `/compact`, `--continue`, `--resume`, `/context`.

## 3. Permissions

`.claude/settings.json` is checked in so both partners get the same rules:

- **allow:** test, lint, typecheck, format, and read-only or local git commands, so the TDD loop runs without prompts.
- **ask:** installing packages, migrations, pushing, merging, opening PRs, deploys, web fetches.
- **deny:** reading or editing `.env*` and `*.pem`, hand-editing migrations, `rm -rf`, force push, `git reset --hard`, `git clean`, `prisma migrate reset`, curl/wget.

Personal overrides go in `.claude/settings.local.json`, which is git-ignored.

Screenshot: `/permissions` showing the rules. `[screenshot: permissions.png]`

## 4. /init and iteration

1. Ran `/init` in Claude Code. Committed its raw output unchanged. `[screenshot: init.png]`
2. Compared it against what the project needs. What `/init` got right and what it missed:
   - Got right: _fill in after running_
   - Missed: _fill in after running_ (expected gaps: testing strategy, auth rules, do's and don'ts, PRD context)
3. Rewrote CLAUDE.md with stack, commands, layout, conventions, do's and don'ts, OWASP notes, Definition of Done, and `@imports` of the PRD, ADRs, testing strategy, context strategy, and the Next.js AGENTS.md. Committed as the second CLAUDE.md revision.

The diff between the two commits is the evidence of iteration: `git log -p -- CLAUDE.md`.

## 5. Context management in practice

Screenshots to capture during Parts 2 and 3:

- `/context` before a large step. `[screenshot]`
- `/compact keep the scheduler constraints and the failing test names` mid-feature. `[screenshot]`
- `/clear` after committing a feature, before starting the next. `[screenshot]`
- `claude --continue` the next day to resume. `[screenshot]`
