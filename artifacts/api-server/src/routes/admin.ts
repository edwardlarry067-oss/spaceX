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
        paystackReference: r.sub.paystackReference,
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
        paystackPlanCode: p.paystackPlanCode,
        paystackPaymentLink: p.paystackPaymentLink,
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
    const { name, category, speed, priceMonthly, features, paystackPlanCode, paystackPaymentLink, popular, description, hardwarePrice } =
      req.body as {
        name: string;
        category: string;
        speed: string;
        priceMonthly: number;
        features: string[];
        paystackPlanCode?: string;
        paystackPaymentLink?: string;
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
        paystackPlanCode,
        paystackPaymentLink,
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
    if (body.paystackPlanCode !== undefined) updateData.paystackPlanCode = body.paystackPlanCode;
    if (body.paystackPaymentLink !== undefined) updateData.paystackPaymentLink = body.paystackPaymentLink;
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
// POST /api/admin/seed-plans
// Inserts the 9 built-in Starlink plans into the DB only when the table is empty.
// Idempotent — safe to call multiple times.
router.post("/admin/seed-plans", adminAuth, async (req, res): Promise<void> => {
  try {
    const existing = await db.select({ id: plansTable.id }).from(plansTable).limit(1);
    if (existing.length > 0) {
      res.json({ message: "Plans already seeded — no changes made.", count: 0 });
      return;
    }

    const defaultPlans = [
      // Residential
      { name: "Starlink Best Effort", category: "residential", speed: "Up to 100 Mbps", priceMonthly: "90.00", hardwarePrice: "499.00", description: "Entry-level satellite internet for light households.", features: ["Best-effort priority", "Suitable for light use", "No contracts"], active: true, popular: false },
      { name: "Starlink Standard", category: "residential", speed: "Up to 200 Mbps", priceMonthly: "120.00", hardwarePrice: "499.00", description: "Standard Starlink service for homes and apartments.", features: ["Unlimited data", "Stream HD video", "Video calls", "No contracts"], active: true, popular: true },
      { name: "Starlink Standard Plus", category: "residential", speed: "Up to 400 Mbps", priceMonthly: "180.00", hardwarePrice: "599.00", description: "Higher priority and faster speeds for demanding households.", features: ["Priority data", "4K streaming", "Multiple devices", "Gaming-grade latency"], active: true, popular: false },
      // Roam
      { name: "Starlink Roam", category: "roam", speed: "Up to 100 Mbps", priceMonthly: "150.00", hardwarePrice: "599.00", description: "Portable Starlink service for travel on land.", features: ["Use anywhere covered", "Pause any time", "In-motion use", "No fixed address needed"], active: true, popular: false },
      { name: "Starlink Maritime Portable", category: "roam", speed: "Up to 220 Mbps", priceMonthly: "250.00", hardwarePrice: "2500.00", description: "Reliable connectivity on boats, yachts, and coastal vessels.", features: ["Marine-grade dish", "In-motion at sea", "Real-time tracking", "Priority network"], active: true, popular: true },
      { name: "Starlink Aviation", category: "roam", speed: "Up to 350 Mbps", priceMonthly: "1500.00", hardwarePrice: "15000.00", description: "In-flight connectivity for private and commercial aircraft.", features: ["In-flight internet", "Passenger Wi-Fi", "Multi-beam coverage", "24/7 priority support"], active: true, popular: false },
      // Business
      { name: "Starlink Business", category: "business", speed: "Up to 500 Mbps", priceMonthly: "350.00", hardwarePrice: "2500.00", description: "High-speed Starlink for SMEs and commercial operations.", features: ["Priority access", "Higher speeds", "Unlimited data", "Business-grade SLA"], active: true, popular: true },
      { name: "Starlink Enterprise", category: "business", speed: "Up to 1 Gbps", priceMonthly: "1000.00", hardwarePrice: "5000.00", description: "Enterprise connectivity for large organisations and remote sites.", features: ["Dedicated bandwidth", "Multi-site management", "Priority support", "Custom SLA"], active: true, popular: false },
      { name: "Starlink Global Elite", category: "business", speed: "1 Gbps+", priceMonthly: "3000.00", hardwarePrice: "10000.00", description: "The highest tier of Starlink service for critical infrastructure and global operations.", features: ["Maximum bandwidth", "Redundant links", "Dedicated account manager", "Custom SLA"], active: true, popular: false },
    ];

    const inserted = await db.insert(plansTable).values(defaultPlans).returning({ id: plansTable.id });
    req.log.info({ count: inserted.length }, "Seeded default plans");
    res.json({ message: `Successfully seeded ${inserted.length} plans.`, count: inserted.length });
  } catch (err) {
    req.log.error({ err }, "Failed to seed plans");
    res.status(500).json({ error: "Failed to seed plans" });
  }
});

export default router;
