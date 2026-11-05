# TradeNest

An internal marketplace for organisations. Employees can **sell, rent or give away** anything they own — products, equipment, vehicles, land, space, services — to **colleagues in the same organisation**.

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
npm run dev                      # http://localhost:3000/health

cd ../web && npm install
npm run dev                      # http://localhost:5173
```

## Roadmap (MVP)

1. Auth: work-email signup, org join via domain / invite code
2. Listings: create, browse, search, filter, photos
3. Sell flow: offer → accept → mark sold
4. Rent flow: availability calendar, booking request → approve → return
5. In-app chat between buyer and seller
6. Reviews and reporting; org admin moderation
7. Push notifications

See [docs/architecture.md](docs/architecture.md).
