# Architecture Plan: BucketLists v0.0.0

## Context
Designing the initial architecture for BucketLists — a collaborative bucket list app where groups can create shared lists, vote on items, and track completion together. This plan incorporates design decisions made during requirements review.

---

## Design Decisions Recorded

| Topic | Decision |
|---|---|
| Frontend | React + TypeScript |
| API style | REST |
| Auth | JWT (stateless) |
| Real-time | Polling every N seconds |
| Email service | Resend |
| Voting rule | >=50% approvals passes; non-votes count as abstain after timeout (suggested default: 72h) |
| Bucket restart | Any single member can trigger restart for all members |
| Item weight | Computed at query time: `importance * total_hours_required` (not stored) |
| Completion % | `completed_items / total_items` (uniform, not weighted), computed at query time |
| Bucket location | Freetext varchar only (no geocoding) |
| Invitations | Email invite with pending state; invitee creates account if needed |
| Member removal | Not in v0; any member can invite others |
| Stored vs computed | Remove `completion_percentage`, `total_weight`, `num_items` from Bucket; remove `weight` from Item |

---

## Revised Data Model

### Changes from spec
- **Remove** from `Bucket`: `completion_percentage`, `total_weight`, `num_items` → computed via SQL
- **Remove** from `Item`: `weight` → computed as `importance * total_hours_required`
- **Add** `Invitation` table for pending email invites
- **Add** `status` to `Item`: `pending` | `approved` | `rejected`
- **Standardize IDs**: use `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` on all tables (drop inconsistent `guid` naming)
- **ItemVote.vote**: constrain to `'approve' | 'reject'`

### Final Tables

```sql
User          (id, name, email, password_hash, created_at, last_login_at)
Bucket        (id, name, location, created_at, created_by, expiration_date, is_completed, completion_date)
BucketMember  (bucket_id, user_id, joined_at)
Item          (id, bucket_id, name, full_address, address_line_1, address_line_2,
               city, state_province, postal_code, country_code, latitude, longitude,
               importance, amount_time_required, time_scale, total_hours_required,
               status, is_completed, completion_date, completed_by, created_at, created_by)
ItemVote      (item_id, user_id, vote CHECK IN ('approve','reject'), cast_at)
Invitation    (id, bucket_id, invited_email, invited_by, token UUID UNIQUE, created_at, accepted_at)
```

### Computed values (via SQL at query time)
- `completion_percentage` = `COUNT(*) FILTER (WHERE is_completed) / COUNT(*)` over items
- `weight` (per item) = `importance * total_hours_required`
- `total_weight` (per bucket) = `SUM(importance * total_hours_required)` over items

---

## Voting Logic

- Items in a **single-member** bucket: auto-approved on creation.
- Items in a **multi-member** bucket: status = `pending`; all members **except the creator** must vote.
- Resolution rules:
  - Triggered when all eligible voters have voted, OR the vote timeout elapses (72h default, configurable via env var).
  - `approvals / eligible_voters >= 0.5` → `approved`; otherwise → `rejected`.
  - Non-votes after timeout count as abstain (excluded from denominator so inactive users don't block good items).

---

## Tech Stack

```
frontend/          React 18 + TypeScript + Vite
backend/           Node.js + Express + TypeScript
database/          PostgreSQL (local dev) → Supabase-hosted (production)
auth               Custom JWT (jsonwebtoken) — no third-party auth provider in v0
email              Resend SDK
hosting            Vercel (frontend + backend as serverless functions)
```

---

## Project Structure

```
bucketlists/
├── frontend/
│   ├── src/
│   │   ├── components/      # shared UI components
│   │   ├── pages/           # route-level views
│   │   ├── api/             # typed fetch wrappers (polling hooks live here)
│   │   └── types/           # shared TypeScript types
│   ├── vite.config.ts
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/          # one file per resource group
│   │   ├── middleware/      # auth JWT middleware, error handler
│   │   ├── services/        # business logic (voting, invitations, restart)
│   │   └── db/              # pg client + migration files
│   └── package.json
└── package.json             # root workspace (npm workspaces or pnpm)
```

---

## REST API (key endpoints)

```
POST   /auth/signup                    create account + send verification email
POST   /auth/login                     returns JWT
GET    /auth/me                        current user from JWT

GET    /buckets                        buckets for current user
POST   /buckets                        create bucket
GET    /buckets/:id                    bucket detail + computed stats
POST   /buckets/:id/restart            trigger restart (creates new bucket with incomplete items)

GET    /buckets/:id/items              all items (approved + pending)
POST   /buckets/:id/items              create item (auto-approves if solo bucket)
PATCH  /items/:id/complete             mark item complete
DELETE /items/:id                      remove item (creator only? TBD)

POST   /items/:id/votes                cast vote (approve/reject)

POST   /buckets/:id/invitations        send invite email via Resend
GET    /invitations/:token             accept invite (redirect to login/signup + join)
```

---

## Invitation Flow

1. Member calls `POST /buckets/:id/invitations` with `{ email }`.
2. Backend creates `Invitation` row with a UUID token; sends email via Resend with link: `{APP_URL}/invite/{token}`.
3. Invitee clicks link → frontend checks if they're logged in:
   - Yes → call `GET /invitations/:token` → backend adds them to `BucketMember` and marks invite accepted.
   - No → redirect to sign-up with token preserved in query param → after account creation, same flow.
4. If the email already has a pending invite to the same bucket, don't send a duplicate.

---

## Bucket Restart Flow

1. Any member calls `POST /buckets/:id/restart`.
2. Backend:
   a. Creates a new `Bucket` row (same name, location, expiration reset or extended).
   b. Copies all **incomplete** items to the new bucket with `status = 'approved'`.
   c. Re-adds all current `BucketMember` rows to the new bucket.
   d. Marks the original bucket `is_completed = true`.
3. All members' next poll response shows the new bucket.

---

## Polling Strategy

- Frontend polls `GET /buckets/:id` every 15 seconds while a bucket detail page is open.
- When the user is on the bucket list page, poll `GET /buckets` every 30 seconds.
- No polling when the page/tab is hidden (`document.visibilityState`).
- Implement with a `usePolling(fn, interval)` custom hook.

---

## UI Pages

| Page | Route | Notes |
|---|---|---|
| Splash/Landing | `/` | Marketing copy, login/signup CTAs |
| Sign Up | `/signup` | Email + password |
| Login | `/login` | Email + password |
| My Buckets | `/buckets` | Grid of tiles; create bucket button |
| Bucket Detail | `/buckets/:id` | Bucket fill graphic + item list + pending section |
| Create Bucket | `/buckets/new` | Inline form or modal |
| Accept Invite | `/invite/:token` | Middleware redirects if not logged in |

---

## Open Questions (decide before implementation)

1. **Vote timeout**: 72 hours is suggested — confirm or adjust.
2. **Email verification**: Does sign-up require email confirmation before the user can log in, or is it skipped in v0?
3. **Item deletion**: Can any member delete an item, or only the creator? What about approved items?
4. **Abstain counting**: Exclude non-voters from the denominator (recommended) vs. count as "no".

---

## Verification Plan

1. Run DB migrations → seed with two test users, one bucket, several items.
2. Log in as user A → create bucket → invite user B via email.
3. Log in as user B → accept invite via token link.
4. User B creates item → confirm it enters `pending` state.
5. User A votes approve → confirm auto-approval at >=50%.
6. Mark item complete → confirm completion_percentage updates at next poll.
7. Complete all items → confirm any member can trigger restart → confirm new bucket has incomplete items.
