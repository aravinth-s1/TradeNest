import Fastify from "fastify";
import cors from "@fastify/cors";
import { listingRoutes } from "./routes/listings";
import { prisma } from "./db";

const app = Fastify({ logger: true });

app.register(cors, { origin: true });
app.get("/health", async () => ({ status: "ok", service: "tradenest-backend" }));

// Dev-only helper so the web client can pick a seeded identity.
app.get("/api/dev/users", async () =>
  prisma.user.findMany({ select: { id: true, name: true, email: true, role: true } }),
);

app.register(listingRoutes);

const port = Number(process.env.PORT ?? 3000);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
