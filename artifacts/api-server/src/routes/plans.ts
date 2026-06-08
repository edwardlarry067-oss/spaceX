import { Router } from "express";
import { db } from "@workspace/db";
import { plansTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function formatPlan(p: typeof plansTable.$inferSelect) {
  return {
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
    localPrices: (p.localPrices && Object.keys(p.localPrices as object).length > 0)
      ? p.localPrices as Record<string, { monthly: number; hardware?: number }>
      : undefined,
    createdAt: p.createdAt,
  };
}

router.get("/plans", async (req, res): Promise<void> => {
  try {
    const plans = await db
      .select()
      .from(plansTable)
      .where(eq(plansTable.active, true))
      .orderBy(plansTable.priceMonthly);
    res.json(plans.map(formatPlan));
  } catch (err) {
    req.log.error({ err }, "Failed to list plans");
    res.status(500).json({ error: "Failed to list plans" });
  }
});

router.get("/plans/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, id));
    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }
    res.json(formatPlan(plan));
  } catch (err) {
    req.log.error({ err }, "Failed to get plan");
    res.status(500).json({ error: "Failed to get plan" });
  }
});

export default router;
