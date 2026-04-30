# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run both frontend and backend dev servers simultaneously
npm run dev

# Build both workspaces
npm run build

# Run only frontend (port 5173)
npm run dev --workspace=frontend

# Run only backend (port 3001)
npm run dev --workspace=backend
```

There are no test or lint scripts yet.

## Architecture

npm workspace monorepo with two packages: `frontend/` (React + Vite) and `backend/` (Express).

**Frontend** proxies all `/api/*` requests to `http://localhost:3001` via Vite config — no CORS handling needed in development. Uses React Router v7 for routing. CSS Modules for component styles; global design tokens in `frontend/src/index.css`.

**Backend** is a plain Express server. No database or auth is implemented yet — only a health check at `GET /api/health`. Environment config is loaded via `dotenv` from `backend/.env` (copy from `backend/.env.example`).

### Data model (planned, not yet implemented)

Six PostgreSQL tables: `User`, `Bucket`, `BucketMember`, `Item`, `ItemVote`, `Invitation`. All primary keys are UUIDs. Item weight is a computed value (`importance × total_hours_required`) — never stored. Bucket completion % = sum of completed item weights / sum of all item weights.

### Voting logic

- Single-member bucket: items auto-approved.
- Multi-member: item approved when ≥50% of eligible voters (all members except creator) approve.
- Non-voters after 72-hour timeout (`VOTE_TIMEOUT_HOURS`) count as abstain.

### Invitation flow

Email contains a UUID token → `GET /invitations/:token` resolves the token, creates a `BucketMember` row, then redirects the invitee into the app.

### Polling

Frontend polls on a fixed interval using a `usePolling(fn, interval)` hook (planned). Bucket detail: 15s, bucket list: 30s. Polling pauses when `document.visibilityState === 'hidden'`.

## Design tokens

```css
--color-primary:       #0B5471
--color-primary-light: #85B7D6
--color-bg:            #F6F0E7
--color-muted:         #797C82
--color-white:         #ffffff
```

## Environment variables

Backend requires a `.env` file (see `backend/.env.example`):

```
PORT=3001
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://user:password@localhost:5432/bucketlists
JWT_SECRET=...
JWT_EXPIRES_IN=7d
GMAIL_USER=...
GMAIL_APP_PASSWORD=...
APP_URL=http://localhost:5173
VOTE_TIMEOUT_HOURS=72
```

## TypeScript notes

- Backend: `CommonJS` modules, `ES2020` target, strict mode.
- Frontend: `ESNext` modules, `ES2020` target, strict mode with `noUnusedLocals` and `noUnusedParameters` enforced.
