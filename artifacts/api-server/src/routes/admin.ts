import { Router } from "express";
import { db } from "@workspace/db";
import { plansTable, subscriptionsTable, siteSettingsTable, usersTable } from "@workspace/db";
import { eq, desc, count, gte, sql, ilike, or } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { adminAuth, ADMIN_PASSWORD, JWT_SECRET } from "../middlewares/adminAuth";

const router = Router();

router.post("/admin/login", async (req, res): Promise<void> => {
  const { password } = req.body as { password: string };
  if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
  res.json({ success: true, token });
});

router.get("/admin/stats", adminAuth, async (req, res): Promise<void> => {
  try {
    const [totalRow] = await db.select({ total: count() }).from(subscriptionsTable);
    const [activeRow] = await db
      .select({ total: count() })
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.status, "active"));
    const [cancelledRow] = await db
      .select({ total: count() })
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.status, "cancelled"));

    const activeRevenue = await db
      .select({ revenue: plansTable.priceMonthly })
      .from(subscriptionsTable)
      .leftJoin(plansTable, eq(subscriptionsTable.planId, plansTable.id))
      .where(eq(subscriptionsTable.status, "active"));

    const monthlyRevenue = activeRevenue.reduce(
      (acc, r) => acc + parseFloat(r.revenue ?? "0"),
      0
    );

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [newThisMonthRow] = await db
      .select({ total: count() })
      .from(subscriptionsTable)
      .where(gte(subscriptionsTable.createdAt, startOfMonth));

    const planBreakdownRows = await db
      .select({
        planName: plansTable.name,
        planCount: count(),
        revenue: sql<string>`coalesce(sum(${plansTable.priceMonthly}), 0)`,
      })
      .from(subscriptionsTable)
      .leftJoin(plansTable, eq(subscriptionsTable.planId, plansTable.id))
      .where(eq(subscriptionsTable.status, "active"))
      .groupBy(plansTable.name);

    const recentRows = await db
      .select({ sub: subscriptionsTable, plan: plansTable })
      .from(subscriptionsTable)
      .leftJoin(plansTable, eq(subscriptionsTable.planId, plansTable.id))
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(5);

    res.json({
      totalSubscriptions: totalRow.total,
      activeSubscriptions: activeRow.total,
      cancelledSubscriptions: cancelledRow.total,
      monthlyRevenue,
      totalRevenue: monthlyRevenue,
      newThisMonth: newThisMonthRow.total,
      planBreakdown: planBreakdownRows.map((r) => ({
        planName: r.planName ?? "Unknown",
        count: r.planCount,
        revenue: parseFloat(r.revenue),
      })),
      recentSubscriptions: recentRows.map((r) => ({
        id: r.sub.id,
        email: r.sub.email,
        name: r.sub.name,
        planId: r.sub.planId,
        planName: r.plan?.name ?? "",
        planCategory: r.plan?.category ?? "",
        priceMonthly: r.plan ? parseFloat(r.plan.priceMonthly) : 0,
        stripeSubscriptionId: r.sub.stripeSubscriptionId,
        stripeCustomerId: r.sub.stripeCustomerId,
        status: r.sub.status,
        address: r.sub.address,
        createdAt: r.sub.createdAt,
        cancelledAt: r.sub.cancelledAt,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get admin stats");
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.get("/admin/plans", adminAuth, async (req, res): Promise<void> => {
  try {
    const plans = await db.select().from(plansTable).orderBy(plansTable.priceMonthly);
    res.json(
      plans.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        speed: p.speed,
        priceMonthly: parseFloat(p.priceMonthly),
        features: p.features,
        stripePriceId: p.stripePriceId,
        stripePaymentLink: p.stripePaymentLink,
        active: p.active,
        popular: p.popular,
        description: p.description,
        hardwarePrice: p.hardwarePrice ? parseFloat(p.hardwarePrice) : undefined,
        createdAt: p.createdAt,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to admin list plans");
    res.status(500).json({ error: "Failed to list plans" });
  }
});

router.post("/admin/plans", adminAuth, async (req, res): Promise<void> => {
  try {
    const { name, category, speed, priceMonthly, features, stripePriceId, stripePaymentLink, popular, description, hardwarePrice } =
      req.body as {
        name: string;
        category: string;
        speed: string;
        priceMonthly: number;
        features: string[];
        stripePriceId?: string;
        stripePaymentLink?: string;
        popular?: boolean;
        description: string;
        hardwarePrice?: number;
      };
    const [plan] = await db
      .insert(plansTable)
      .values({
        name,
        category,
        speed,
        priceMonthly: String(priceMonthly),
        features: features ?? [],
        stripePriceId,
        stripePaymentLink,
        popular: popular ?? false,
        description,
        hardwarePrice: hardwarePrice ? String(hardwarePrice) : null,
      })
      .returning();
    res.status(201).json({
      ...plan,
      priceMonthly: parseFloat(plan.priceMonthly),
      hardwarePrice: plan.hardwarePrice ? parseFloat(plan.hardwarePrice) : undefined,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create plan");
    res.status(500).json({ error: "Failed to create plan" });
  }
});

router.patch("/admin/plans/:id", adminAuth, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.speed !== undefined) updateData.speed = body.speed;
    if (body.priceMonthly !== undefined) updateData.priceMonthly = String(body.priceMonthly);
    if (body.features !== undefined) updateData.features = body.features;
    if (body.stripePriceId !== undefined) updateData.stripePriceId = body.stripePriceId;
    if (body.stripePaymentLink !== undefined) updateData.stripePaymentLink = body.stripePaymentLink;
    if (body.active !== undefined) updateData.active = body.active;
    if (body.popular !== undefined) updateData.popular = body.popular;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.hardwarePrice !== undefined)
      updateData.hardwarePrice = body.hardwarePrice ? String(body.hardwarePrice) : null;

    const [updated] = await db
      .update(plansTable)
      .set(updateData)
      .where(eq(plansTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }
    res.json({
      ...updated,
      priceMonthly: parseFloat(updated.priceMonthly),
      hardwarePrice: updated.hardwarePrice ? parseFloat(updated.hardwarePrice) : undefined,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update plan");
    res.status(500).json({ error: "Failed to update plan" });
  }
});

router.delete("/admin/plans/:id", adminAuth, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const [updated] = await db
      .update(plansTable)
      .set({ active: false })
      .where(eq(plansTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }
    res.json({
      ...updated,
      priceMonthly: parseFloat(updated.priceMonthly),
      hardwarePrice: updated.hardwarePrice ? parseFloat(updated.hardwarePrice) : undefined,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to deactivate plan");
    res.status(500).json({ error: "Failed to deactivate plan" });
  }
});

router.get("/admin/revenue", adminAuth, async (req, res): Promise<void> => {
  try {
    const rows = await db
      .select({
        month: sql<string>`to_char(${subscriptionsTable.createdAt}, 'YYYY-MM')`,
        revenue: sql<string>`coalesce(sum(${plansTable.priceMonthly}), 0)`,
        subscriptionCount: count(),
      })
      .from(subscriptionsTable)
      .leftJoin(plansTable, eq(subscriptionsTable.planId, plansTable.id))
      .where(eq(subscriptionsTable.status, "active"))
      .groupBy(sql`to_char(${subscriptionsTable.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${subscriptionsTable.createdAt}, 'YYYY-MM')`);

    res.json({
      monthly: rows.map((r) => ({
        month: r.month,
        revenue: parseFloat(r.revenue),
        subscriptions: r.subscriptionCount,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get revenue stats");
    res.status(500).json({ error: "Failed to get revenue stats" });
  }
});

router.get("/admin/get-env", adminAuth, async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(siteSettingsTable);
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json({ settings });
  } catch (err) {
    req.log.error({ err }, "Failed to get env settings");
    res.status(500).json({ error: "Failed to get settings" });
  }
});

router.post("/admin/set-env", adminAuth, async (req, res): Promise<void> => {
  try {
    const { vars } = req.body as { vars: Record<string, string> };
    if (!vars || typeof vars !== "object") {
      res.status(400).json({ error: "vars object is required" });
      return;
    }

    const toSet = Object.entries(vars).filter(([, v]) => v && String(v).trim().length > 0);
    if (toSet.length === 0) {
      res.status(400).json({ error: "No non-empty vars provided" });
      return;
    }

    const created: string[] = [];
    for (const [key, value] of toSet) {
      await db
        .insert(siteSettingsTable)
        .values({ key, value: String(value).trim() })
        .onConflictDoUpdate({
          target: siteSettingsTable.key,
          set: { value: String(value).trim(), updatedAt: new Date() },
        });
      process.env[key] = String(value).trim();
      created.push(key);
    }

    res.json({ success: true, created });
  } catch (err) {
    req.log.error({ err }, "Failed to set env settings");
    res.status(500).json({ error: "Failed to save settings" });
  }
});


// ── Admin: Users ──────────────────────────────────────────────────────────────

router.get("/admin/users", adminAuth, async (req, res): Promise<void> => {
  try {
    const rows = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        phone: usersTable.phone,
        address: usersTable.address,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt));

    const subCounts = await db
      .select({
        email: subscriptionsTable.email,
        count: count(),
      })
      .from(subscriptionsTable)
      .groupBy(subscriptionsTable.email);

    const subMap = new Map(subCounts.map(r => [r.email, Number(r.count)]));

    res.json(
      rows.map(u => ({
        ...u,
        subscriptionCount: subMap.get(u.email) ?? 0,
        walletBalance: 0,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list users");
    res.status(500).json({ error: "Failed to list users" });
  }
});

router.delete("/admin/users/:id", adminAuth, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const [deleted] = await db
      .delete(usersTable)
      .where(eq(usersTable.id, id))
      .returning({ id: usersTable.id });
    if (!deleted) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete user");
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// ── Seed default plans ─────────────────────────────────────────────────────────
// Real 2025 Starlink plan data
const OFFICIAL_STARLINK_PLANS = [
  {
    name: "Starlink Residential",
    category: "residential",
    speed: "25–100 Mbps",
    priceMonthly: "120.00",
    hardwarePrice: "599.00",
    description: "High-speed satellite internet for homes. Unlimited data, no contracts, cancel anytime.",
    features: ["Unlimited data", "25–100 Mbps download", "Priority residential data", "Free installation support", "Wi-Fi router included", "24/7 customer support", "No contracts"],
    active: true,
    popular: true,
  },
  {
    name: "Starlink Roam",
    category: "roam",
    speed: "25–100 Mbps",
    priceMonthly: "150.00",
    hardwarePrice: "599.00",
    description: "Take your Starlink anywhere on land. Use while parked, camping, or travelling.",
    features: ["Use anywhere on land", "Pause & resume service anytime", "25–100 Mbps download", "Deprioritised on congested cells", "Wi-Fi router included", "24/7 support"],
    active: true,
    popular: false,
  },
  {
    name: "Starlink Mobile Priority",
    category: "roam",
    speed: "5–50 Mbps",
    priceMonthly: "50.00",
    hardwarePrice: "0.00",
    description: "50 GB of high-speed priority mobile data. Perfect add-on for Roam subscribers on the move.",
    features: ["50 GB priority data/month", "In-motion use", "Land & sea coverage", "Add-on to Roam plan", "No extra hardware needed"],
    active: true,
    popular: false,
  },
  {
    name: "Starlink Priority (40 GB)",
    category: "business",
    speed: "40–220 Mbps",
    priceMonthly: "250.00",
    hardwarePrice: "2500.00",
    description: "Enterprise-grade connectivity with 40 GB priority data. Ideal for remote offices and farms.",
    features: ["40 GB priority data/month", "40–220 Mbps download", "Priority over residential users", "SLA-backed uptime", "Dedicated business support", "Business dashboard"],
    active: true,
    popular: false,
  },
  {
    name: "Starlink Priority (1 TB)",
    category: "business",
    speed: "40–220 Mbps",
    priceMonthly: "500.00",
    hardwarePrice: "2500.00",
    description: "1 TB priority data for data-heavy business operations requiring consistent fast speeds.",
    features: ["1 TB priority data/month", "40–220 Mbps download", "Priority network access", "SLA-backed uptime", "Dedicated business support", "Multi-user support"],
    active: true,
    popular: true,
  },
  {
    name: "Starlink Priority (6 TB)",
    category: "business",
    speed: "100–350 Mbps",
    priceMonthly: "1500.00",
    hardwarePrice: "0.00",
    description: "6 TB priority data for enterprise businesses with heavy bandwidth requirements.",
    features: ["6 TB priority data/month", "100–350 Mbps download", "Highest priority access", "Enterprise SLA", "24/7 dedicated support", "Custom network configuration"],
    active: true,
    popular: false,
  },
  {
    name: "Starlink Maritime (50 GB)",
    category: "maritime",
    speed: "40–220 Mbps",
    priceMonthly: "250.00",
    hardwarePrice: "2500.00",
    description: "Reliable high-speed internet at sea. 50 GB priority data for vessels and boats.",
    features: ["50 GB priority maritime data", "40–220 Mbps at sea", "Global ocean coverage", "In-motion marine use", "Weather-resistant hardware", "24/7 maritime support"],
    active: true,
    popular: false,
  },
  {
    name: "Starlink Maritime (1 TB)",
    category: "maritime",
    speed: "100–350 Mbps",
    priceMonthly: "1000.00",
    hardwarePrice: "2500.00",
    description: "High-capacity maritime internet. 1 TB priority data for commercial and charter vessels.",
    features: ["1 TB maritime priority data", "100–350 Mbps at sea", "Global ocean coverage", "In-motion use", "Fleet management dashboard", "Dual dish support available"],
    active: true,
    popular: false,
  },
  {
    name: "Starlink Aviation",
    category: "aviation",
    speed: "40–350 Mbps",
    priceMonthly: "12500.00",
    hardwarePrice: "150000.00",
    description: "In-flight high-speed internet for commercial and private aircraft. Contact us for custom enterprise pricing.",
    features: ["In-flight connectivity", "40–350 Mbps in air", "Global coverage", "Passenger Wi-Fi ready", "FAA/EASA certified hardware", "Dedicated aviation support"],
    active: true,
    popular: false,
  },
];

// POST /api/admin/seed-plans
// Pass { "force": true } to wipe and replace all plans with official 2025 Starlink pricing.
// Without force, only seeds when the table is empty.
router.post("/admin/seed-plans", adminAuth, async (req, res): Promise<void> => {
  try {
    const force = req.body?.force === true;

    if (!force) {
      const existing = await db.select({ id: plansTable.id }).from(plansTable).limit(1);
      if (existing.length > 0) {
        res.json({ message: "Plans already seeded — no changes made.", count: 0 });
        return;
      }
    } else {
      await db.delete(plansTable);
      req.log.info("Deleted all existing plans for force-reseed");
    }

    const inserted = await db.insert(plansTable).values(OFFICIAL_STARLINK_PLANS).returning({ id: plansTable.id });
    req.log.info({ count: inserted.length, force }, "Seeded official Starlink plans");
    res.json({ message: `Successfully loaded ${inserted.length} official Starlink plans.`, count: inserted.length });
  } catch (err) {
    req.log.error({ err }, "Failed to seed plans");
    res.status(500).json({ error: "Failed to seed plans" });
  }
});

export default router;
