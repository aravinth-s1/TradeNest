import type { FastifyReply, FastifyRequest } from "fastify";
import type { User } from "@prisma/client";
import { prisma } from "./db";

declare module "fastify" {
  interface FastifyRequest {
    user: User;
  }
}

/**
 * TEMPORARY dev auth: identifies the caller by the `x-user-id` header.
 * Replace with real JWT + work-email signup (see roadmap). Everything downstream
 * only relies on `req.user`, so swapping this out won't touch the routes.
 */
export async function requireUser(req: FastifyRequest, reply: FastifyReply) {
  const id = req.headers["x-user-id"];
  if (typeof id !== "string") {
    return reply.code(401).send({ error: "Missing x-user-id header (dev auth)" });
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return reply.code(401).send({ error: "Unknown user" });
  req.user = user;
}
