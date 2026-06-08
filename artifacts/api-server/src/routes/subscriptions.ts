import { Router } from "express";
import { db } from "@workspace/db";
import { subscriptionsTable, plansTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { sendCancellationEmail } from "../lib/email";
import { adminAuth, JWT_SECRET } from "../middlewares/adminAuth";
import jwt from "jsonwebtoken";

const router = Router();

function formatSub(sub: typeof subscriptionsTable.$inferSelect, plan: typeof plansTable.$inferSelect | null) {
  return {
    id: sub.id,
    email: sub.email,
    name: sub.name,
    planId: sub.planId,
    planName: plan?.name ?? "",
    planCategory: plan?.category ?? "",
    planSpeed: plan?.speed ?? "",
    priceMonthly: plan ? parseFloat(plan.priceMonthly) : 0,
    features: plan?.features ?? [],
    paystackReference: sub.paystackReference,
    status: sub.status,
    address: sub.address,
    createdAt: sub.createdAt,
    cancelledAt: sub.cancelledAt,
  };
}

router.get("/subscriptions", async (req, res): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const email = req.query.email as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    let whereClause: any;
    if (email) {
      whereClause = eq(subscriptionsTable.email, email.toLowerCase());
    } else if (status && status !== "all") {
      whereClause = eq(subscriptionsTable.status, status);
    }

    const rows = await db
      .select({ sub: subscriptionsTable, plan: plansTable })
      .from(subscriptionsTable)
      .leftJoin(plansTable, eq(subscriptionsTable.planId, plansTable.id))
      .where(whereClause)
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(subscriptionsTable)
      .where(whereClause);

    res.json({
      subscriptions: rows.map((r) => formatSub(r.sub, r.plan)),
      total,
      page,
      limit,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list subscriptions");
    res.status(500).json({ error: "Failed to list subscriptions" });
  }
});

router.get("/subscriptions/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const [row] = await db
      .select({ sub: subscriptionsTable, plan: plansTable })
      .from(subscriptionsTable)
      .leftJoin(plansTable, eq(subscriptionsTable.planId, plansTable.id))
      .where(eq(subscriptionsTable.id, id));

    if (!row) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }
    res.json(formatSub(row.sub, row.plan));
  } catch (err) {
    req.log.error({ err }, "Failed to get subscription");
    res.status(500).json({ error: "Failed to get subscription" });
  }
});

router.patch("/subscriptions/:id", async (req, res): Promise<void> => {
  const auth = req.headers.authorization as string | undefined;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let isAdmin = false;
  let userEmail: string | null = null;
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as Record<string, unknown>;
    if (decoded.role === "admin") {
      isAdmin = true;
    } else if (typeof decoded.email === "string") {
      userEmail = decoded.email;
    } else {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const { status } = req.body;

    if (!isAdmin) {
      if (status !== "cancelled") {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      const [existing] = await db
        .select()
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.id, id))
        .limit(1);
      if (!existing) {
        res.status(404).json({ error: "Subscription not found" });
        return;
      }
      if (existing.email.toLowerCase() !== (userEmail ?? "").toLowerCase()) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
    }

    const updateData: Record<string, unknown> = { status };
    if (status === "cancelled") updateData.cancelledAt = new Date();

    const [updated] = await db
      .update(subscriptionsTable)
      .set(updateData)
      .where(eq(subscriptionsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }

    const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, updated.planId));

    if (status === "cancelled" && plan) {
      sendCancellationEmail({
        customerName: updated.name,
        customerEmail: updated.email,
        planName: plan.name,
        priceMonthly: parseFloat(plan.priceMonthly),
      }).catch(() => {});
    }

    res.json(formatSub(updated, plan ?? null));
  } catch (err) {
    req.log.error({ err }, "Failed to update subscription");
    res.status(500).json({ error: "Failed to update subscription" });
  }
});

// POST /api/subscriptions/:id/cancel
// Convenience endpoint used by the customer dashboard
router.post("/subscriptions/:id/cancel", async (req, res): Promise<void> => {
  const auth = req.headers.authorization as string | undefined;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let userEmail: string | null = null;
  let isAdmin = false;
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as Record<string, unknown>;
    if (decoded.role === "admin") {
      isAdmin = true;
    } else if (typeof decoded.email === "string") {
      userEmail = decoded.email;
    } else {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const [existing] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }

    if (!isAdmin && existing.email.toLowerCase() !== (userEmail ?? "").toLowerCase()) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (existing.status === "cancelled") {
      res.status(400).json({ error: "Subscription is already cancelled" });
      return;
    }

    const [updated] = await db
      .update(subscriptionsTable)
      .set({ status: "cancelled", cancelledAt: new Date() })
      .where(eq(subscriptionsTable.id, id))
      .returning();

    const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, updated.planId));

    if (plan) {
      sendCancellationEmail({
        customerName: updated.name,
        customerEmail: updated.email,
        planName: plan.name,
        priceMonthly: parseFloat(plan.priceMonthly),
      }).catch(() => {});
    }

    res.json({ success: true, subscription: formatSub(updated, plan ?? null) });
  } catch (err) {
    req.log.error({ err }, "Failed to cancel subscription");
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

export default router;
