# TradeNest

An internal marketplace for organisations. Employees can **sell or rent** anything they own — products, equipment, vehicles, land, space, services — to **colleagues in the same organisation**.

TradeNest is **only a marketplace**: it lists things and connects people. There are no in-app payments and no in-app chat — buyers contact the seller directly and settle outside the app.

## Core ideas

- **Org-scoped by default**: every listing, chat and transaction belongs to one organisation. Users never see data from another org.
- **Sell or rent**: listings are either `SELL` (one-off) or `RENT` (per hour/day/week/month, with availability and deposits).
- **Anything goes**: categories are configurable per organisation (products, land, vehicles, services, other).
- **Trust**: verified work email, ratings/reviews, org admins can moderate.

## Repo layout

```
backend/   Fastify + TypeScript + Prisma + PostgreSQL REST API
web/       React + Vite installable PWA (mobile browsers + desktop)
docs/      Architecture and product docs
```

## Quick start

```bash
docker compose up -d db          # PostgreSQL
cd backend && npm install
cp .env.example .env
npx prisma migrate dev
npm run db:seed                  # demo org, 2 users, 3 listings
npm run dev                      # http://localhost:3000/health

cd ../web && npm install
npm run dev                      # http://localhost:5173
```

## Status

Core marketplace is working: create, browse, search, filter (type/category/price), paginate, and manage (mark sold/rented, archive, relist) listings, always scoped to the caller's organisation.

**Temporary:** auth is a dev stub (`x-user-id` header, user picker in the UI). Real work-email signup is deferred until the core is done.

## Roadmap (MVP)

1. Auth: work-email signup, join the organisation via domain / invite code
2. Listings: create, browse, search, filter, photos
3. Seller contact details shown to org members on each listing
4. Seller marks listing as sold / rented / archived
5. Report listing + admin moderation
6. Push notifications (new listings, saved searches)

See [docs/architecture.md](docs/architecture.md).
