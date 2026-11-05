import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { requireUser } from "../auth";

const type = z.enum(["SELL", "RENT"]);
const category = z.enum(["PRODUCT", "LAND", "VEHICLE", "SPACE", "SERVICE", "OTHER"]);
const rentUnit = z.enum(["HOUR", "DAY", "WEEK", "MONTH"]);
const status = z.enum(["ACTIVE", "RESERVED", "SOLD", "RENTED", "ARCHIVED"]);

const listingBody = z.object({
  type,
  category,
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(1).max(5000),
  priceCents: z.number().int().min(0),
  currency: z.string().length(3).default("INR"),
  rentUnit: rentUnit.optional(),
  depositCents: z.number().int().min(0).optional(),
  location: z.string().trim().max(200).optional(),
  contactNote: z.string().trim().min(1).max(300),
  photos: z.array(z.string().url()).max(10).default([]),
});

const refine = (b: z.infer<typeof listingBody> | Partial<z.infer<typeof listingBody>>) =>
  b.type === "RENT" && !b.rentUnit ? "rentUnit is required for RENT listings" : null;

const query = z.object({
  q: z.string().trim().optional(),
  type: type.optional(),
  category: category.optional(),
  status: status.default("ACTIVE"),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  mine: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

const include = { seller: { select: { id: true, name: true, email: true } } } as const;

export async function listingRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireUser);

  // Browse / search. Always scoped to the caller's organisation.
  app.get("/api/listings", async (req, reply) => {
    const p = query.safeParse(req.query);
    if (!p.success) return reply.code(400).send({ error: p.error.flatten() });
    const f = p.data;
    const where: Prisma.ListingWhereInput = {
      organizationId: req.user.organizationId,
      status: f.status,
      type: f.type,
      category: f.category,
      sellerId: f.mine ? req.user.id : undefined,
      priceCents: { gte: f.minPrice, lte: f.maxPrice },
      OR: f.q
        ? [
            { title: { contains: f.q, mode: "insensitive" } },
            { description: { contains: f.q, mode: "insensitive" } },
            { location: { contains: f.q, mode: "insensitive" } },
          ]
        : undefined,
    };
    const items = await prisma.listing.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
      take: f.limit + 1,
      ...(f.cursor ? { cursor: { id: f.cursor }, skip: 1 } : {}),
    });
    const nextCursor = items.length > f.limit ? items.pop()!.id : null;
    return { items, nextCursor };
  });

  app.get<{ Params: { id: string } }>("/api/listings/:id", async (req, reply) => {
    const l = await prisma.listing.findFirst({
      where: { id: req.params.id, organizationId: req.user.organizationId },
      include,
    });
    return l ?? reply.code(404).send({ error: "Not found" });
  });

  app.post("/api/listings", async (req, reply) => {
    const p = listingBody.safeParse(req.body);
    if (!p.success) return reply.code(400).send({ error: p.error.flatten() });
    const err = refine(p.data);
    if (err) return reply.code(400).send({ error: err });
    const l = await prisma.listing.create({
      data: {
        ...p.data,
        status: "ACTIVE",
        organizationId: req.user.organizationId,
        sellerId: req.user.id,
      },
      include,
    });
    return reply.code(201).send(l);
  });

  // Seller edits their own listing; also used to mark it sold / rented / archived.
  app.patch<{ Params: { id: string } }>("/api/listings/:id", async (req, reply) => {
    const p = listingBody.partial().extend({ status: status.optional() }).safeParse(req.body);
    if (!p.success) return reply.code(400).send({ error: p.error.flatten() });
    const existing = await prisma.listing.findFirst({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!existing) return reply.code(404).send({ error: "Not found" });
    if (existing.sellerId !== req.user.id && req.user.role !== "ADMIN") {
      return reply.code(403).send({ error: "Only the seller or an admin can edit this listing" });
    }
    const merged = { type: existing.type, rentUnit: existing.rentUnit ?? undefined, ...p.data };
    const err = refine(merged);
    if (err) return reply.code(400).send({ error: err });
    return prisma.listing.update({ where: { id: existing.id }, data: p.data, include });
  });
}
