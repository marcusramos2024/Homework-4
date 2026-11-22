# Context management strategy

How we keep Claude Code sessions focused and cheap.

## What lives where

- **CLAUDE.md** (checked in): stable project facts, conventions, and rules. Kept short; details are pulled in with `@imports` so each doc can change on its own.
- **docs/PRD.md, docs/architecture.md, docs/testing.md**: imported into CLAUDE.md, so every session starts with requirements, decisions, and testing rules without us pasting them.
- **Auto memory**: personal, per-developer learnings Claude saves across sessions. Anything the whole team needs gets promoted into CLAUDE.md or a doc instead.
- **.claude/settings.local.json** (git-ignored): personal permission tweaks.

## Commands and when we use them

| Command             | When                                                                             | Example                                                              |
| ------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `/clear`            | Switching to an unrelated task, or after a task is committed                     | Finished the round-robin generator, now starting on auth: `/clear`   |
| `/compact <focus>`  | Long session on one task where context is getting full but we want to keep going | `/compact keep the scheduler constraints and the failing test names` |
| `claude --continue` | Resuming the most recent session the next day                                    | Pick up the rescheduler work where we left off                       |
| `claude --resume`   | Going back to an older specific session                                          | Re-open the session where we planned the standings tiebreakers       |
| `/context`          | Checking how full the context is before a big step                               | Before asking for a multi-file refactor                              |

## Habits

- One task per session; commit, then `/clear`.
- Start feature work with Explore and Plan mode, so the plan is in context before any code is written. Save longer plans to `docs/plans/<feature>.md` so they survive `/clear`.
- Point Claude at specific files (`@src/lib/scheduler/roundRobin.ts`) instead of asking it to search the whole repo.
- When Claude repeats the same mistake twice, add a rule to CLAUDE.md rather than correcting it again in chat.
