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

## Domain model
- **Organization** — name, email domains, settings
- **User** — belongs to one Organization, role `MEMBER | ADMIN`
- **Listing** — `SELL` or `RENT`, category, price, rent unit, status, photos
- **Order** — a sale of a listing (offer → accepted → completed)
- **Booking** — a rental of a listing over a date range
- **Message** — buyer/seller chat scoped to a listing
- **Review** — rating after a completed order/booking
- **Report** — flagged listing/user for admin moderation

## Open questions
- Payments: in-app (Stripe/Razorpay) vs. off-platform settlement for MVP?
- Can one user belong to multiple organisations?
- Legal/compliance for land and high-value assets (listing is an enquiry, not a title transfer)?
