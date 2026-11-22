# Backlog

Items to open as GitHub issues.

## Only coordinators can create or edit leagues (US-1)

Deferred from the league setup work because auth doesn't exist yet.

Acceptance criteria:

- The create and edit league server actions call `requireRole(leagueId, "coordinator")` before validating input.
- A captain, a player, and a signed-out user each get a 403 and nothing is saved.
- A coordinator of a different league gets a 403.
- Integration tests in `tests/integration/` cover the allowed role and each denied role.

Depends on: Auth.js setup and the `Membership` table.
