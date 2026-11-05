import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { inviteCode: "ACME-DEV" },
    update: {},
    create: { name: "Acme Corp", domains: ["acme.test"], inviteCode: "ACME-DEV" },
  });
  const [asha, ravi] = await Promise.all(
    [
      { email: "asha@acme.test", name: "Asha", role: "ADMIN" as const },
      { email: "ravi@acme.test", name: "Ravi", role: "MEMBER" as const },
    ].map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: { ...u, passwordHash: "dev", emailVerified: true, organizationId: org.id },
      }),
    ),
  );
  if ((await prisma.listing.count()) === 0) {
    await prisma.listing.createMany({
      data: [
        { type: "SELL", category: "PRODUCT", title: "Standing desk (electric)", description: "Barely used, 140cm.", priceCents: 800000, location: "Block B", contactNote: "Ping me at desk B-22", sellerId: asha.id, organizationId: org.id, status: "ACTIVE" },
        { type: "RENT", category: "VEHICLE", title: "Honda Activa for weekends", description: "Helmet included.", priceCents: 40000, rentUnit: "DAY", depositCents: 200000, location: "Parking P2", contactNote: "WhatsApp 98xxxxxx01", sellerId: ravi.id, organizationId: org.id, status: "ACTIVE" },
        { type: "SELL", category: "LAND", title: "500 sq yd plot near Hosur Rd", description: "Clear title, enquiries only.", priceCents: 1500000000, location: "Hosur", contactNote: "Email ravi@acme.test", sellerId: ravi.id, organizationId: org.id, status: "ACTIVE" },
      ],
    });
  }
}

main().finally(() => prisma.$disconnect());
