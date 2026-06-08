import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { plansTable } from "@workspace/db";
import { sql } from "drizzle-orm";

// ── Auto-seed plans if table is empty ────────────────────────────────────────
async function seedIfEmpty() {
  try {
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(plansTable);
    if (Number(count) > 0) return;

    const PLANS = [
      { name: "Starlink Best Effort",  category: "residential", speed: "5–100 Mbps",      priceMonthly: "90.00",   hardwarePrice: "599.00",   description: "Affordable option for light internet users in areas with high Starlink demand.",                           features: ["Unlimited data","Best-effort speeds","Cancel anytime","Secure Paystack checkout"], popular: false, active: true },
      { name: "Starlink Standard",     category: "residential", speed: "50–250 Mbps",     priceMonthly: "120.00",  hardwarePrice: "599.00",   description: "Reliable high-speed internet for homes and apartments.",                                                    features: ["Unlimited data","Priority speeds","Cancel anytime","Secure Paystack checkout"],    popular: false, active: true },
      { name: "Starlink Standard Plus",category: "residential", speed: "100–300 Mbps",    priceMonthly: "150.00",  hardwarePrice: "599.00",   description: "Our most popular residential plan with priority speeds and enhanced support.",                               features: ["Unlimited data","Priority access","Faster speeds","Cancel anytime"],           popular: true,  active: true },
      { name: "Starlink Roam",         category: "roam",        speed: "50–200 Mbps",     priceMonthly: "150.00",  hardwarePrice: "599.00",   description: "Use Starlink anywhere on land. Perfect for road trips and mobile workers.",                                  features: ["Unlimited data","Use on the move","100+ countries","Cancel anytime"],          popular: false, active: true },
      { name: "Starlink Maritime",     category: "roam",        speed: "100–350 Mbps",    priceMonthly: "250.00",  hardwarePrice: "2500.00",  description: "High-speed internet at sea for boats, yachts, and vessels of all sizes.",                                   features: ["In-motion at sea","Priority maritime speeds","Global ocean coverage","24/7 support"], popular: true, active: true },
      { name: "Starlink Aviation",     category: "roam",        speed: "100–350 Mbps",    priceMonthly: "500.00",  hardwarePrice: "5000.00",  description: "Connectivity in the sky for private aircraft and commercial fleets.",                                        features: ["In-flight internet","Global air coverage","Low latency","Enterprise SLA"],     popular: false, active: true },
      { name: "Starlink Business",     category: "business",    speed: "200–500 Mbps",    priceMonthly: "500.00",  hardwarePrice: "2500.00",  description: "Dedicated business-grade speeds for offices, clinics, and small enterprises.",                              features: ["Priority data","Dedicated bandwidth","Business support","Cancel anytime"],     popular: false, active: true },
      { name: "Starlink Enterprise",   category: "business",    speed: "500 Mbps–1 Gbps", priceMonthly: "1500.00", hardwarePrice: "5000.00",  description: "Mission-critical connectivity for large enterprises, NGOs, and government agencies.",                       features: ["SLA guarantee","Dedicated capacity","24/7 priority support","Multi-site management"], popular: true, active: true },
      { name: "Starlink Global Elite", category: "business",    speed: "1 Gbps+",         priceMonthly: "3000.00", hardwarePrice: "10000.00", description: "The highest tier of Starlink service for critical infrastructure and global operations.",                  features: ["Maximum bandwidth","Redundant links","Dedicated account manager","Custom SLA"], popular: false, active: true },
    ];

    await db.insert(plansTable).values(PLANS);
    logger.info({ count: PLANS.length }, "Auto-seeded plans table");
  } catch (err) {
    logger.warn({ err }, "Auto-seed skipped (table may not exist yet)");
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Seed plans on first boot if table is empty
  seedIfEmpty();
});
