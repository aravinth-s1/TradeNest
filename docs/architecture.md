# Architecture

## Stack
| Layer | Choice | Why |
|---|---|---|
| Client | React + Vite PWA (TypeScript) | One codebase; installable on phones and desktop. Native/Tauri wrapper later only if needed |
| API | Fastify + TypeScript | Fast, typed, simple |
| DB | PostgreSQL + Prisma | Relational data, strong migrations |
| Files | S3-compatible object storage | Listing photos |
| Auth | JWT (access + refresh), email verification | Org membership via email domain or invite |

## Multi-tenancy
Single database, shared schema. Every tenant-owned table carries `organizationId`, and every query is filtered by the caller's `organizationId` taken from the JWT — never from request input.

## Scope decisions
- **Single organisation**: the deployment serves one organisation; each user belongs to exactly one.
- **Marketplace only**: no payments, no escrow, no in-app chat. Buyers contact the seller directly (via the seller's contact note) and settle outside the app, so TradeNest carries no payment or transaction-dispute liability.
- Prices and deposits are informational. Land and high-value assets are listings/enquiries, not title transfers.

## Domain model
- **Organization** — name, email domains, invite code
- **User** — belongs to the Organization, role `MEMBER | ADMIN`
- **Listing** — `SELL` or `RENT`, category, price, rent unit, contact note, status, photos
- **Report** (later) — flagged listing for admin moderation
