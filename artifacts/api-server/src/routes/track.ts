import { Router } from "express";
import { db } from "@workspace/db";
import { subscriptionsTable, plansTable, whatsappOrdersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

function statusMeta(status: string): { label: string; step: number } {
  const map: Record<string, { label: string; step: number }> = {
    active:    { label: "Active",    step: 4 },
    pending:   { label: "Pending",   step: 1 },
    paid:      { label: "Paid",      step: 2 },
    shipped:   { label: "Shipped",   step: 3 },
    delivered: { label: "Delivered", step: 4 },
    cancelled: { label: "Cancelled", step: 0 },
    suspended: { label: "Suspended", step: 0 },
  };
  return map[status] ?? { label: status, step: 1 };
}

router.get("/track", async (req, res): Promise<void> => {
  const query = (req.query.q as string | undefined)?.trim();

  if (!query) {
    res.status(400).json({ error: "Provide an email address or order reference." });
    return;
  }

  try {
    const results: object[] = [];
    const isEmail = query.includes("@");

    if (isEmail) {
      const email = query.toLowerCase();

      const subs = await db
        .select({ sub: subscriptionsTable, plan: plansTable })
        .from(subscriptionsTable)
        .leftJoin(plansTable, eq(subscriptionsTable.planId, plansTable.id))
        .where(eq(subscriptionsTable.email, email))
        .orderBy(desc(subscriptionsTable.createdAt));

      for (const { sub, plan } of subs) {
        const { label, step } = statusMeta(sub.status);
        results.push({
          type: "subscription",
          ref: `SUB-${sub.id}`,
          status: sub.status,
          statusLabel: label,
          step,
          planName: plan?.name ?? "Unknown Plan",
          planCategory: plan?.category ?? "",
          planSpeed: plan?.speed ?? "",
          priceMonthly: plan ? parseFloat(plan.priceMonthly) : 0,
          customerName: sub.name,
          customerEmail: sub.email,
          address: sub.address,
          createdAt: sub.createdAt,
          cancelledAt: sub.cancelledAt,
        });
      }

      const orders = await db
        .select()
        .from(whatsappOrdersTable)
        .where(eq(whatsappOrdersTable.customerEmail, email))
        .orderBy(desc(whatsappOrdersTable.createdAt));

      for (const order of orders) {
        const { label, step } = statusMeta(order.paymentStatus);
        results.push({
          type: "order",
          ref: `ORD-${order.id}`,
          status: order.paymentStatus,
          statusLabel: label,
          step,
          planName: order.planName,
          planCategory: "",
          planSpeed: "",
          priceMonthly: 0,
          customerName: order.customerName,
          customerEmail: order.customerEmail ?? email,
          address: order.address,
          createdAt: order.createdAt,
          cancelledAt: null,
          paymentMethod: order.paymentMethod,
        });
      }
    } else {
      const upper = query.toUpperCase();

      if (upper.startsWith("SUB-")) {
        const id = parseInt(upper.replace("SUB-", ""), 10);
        if (!isNaN(id)) {
          const rows = await db
            .select({ sub: subscriptionsTable, plan: plansTable })
            .from(subscriptionsTable)
            .leftJoin(plansTable, eq(subscriptionsTable.planId, plansTable.id))
            .where(eq(subscriptionsTable.id, id));

          for (const { sub, plan } of rows) {
            const { label, step } = statusMeta(sub.status);
            results.push({
              type: "subscription",
              ref: `SUB-${sub.id}`,
              status: sub.status,
              statusLabel: label,
              step,
              planName: plan?.name ?? "Unknown Plan",
              planCategory: plan?.category ?? "",
              planSpeed: plan?.speed ?? "",
              priceMonthly: plan ? parseFloat(plan.priceMonthly) : 0,
              customerName: sub.name,
              customerEmail: sub.email,
              address: sub.address,
              createdAt: sub.createdAt,
              cancelledAt: sub.cancelledAt,
            });
          }
        }
      } else if (upper.startsWith("ORD-")) {
        const id = parseInt(upper.replace("ORD-", ""), 10);
        if (!isNaN(id)) {
          const rows = await db
            .select()
            .from(whatsappOrdersTable)
            .where(eq(whatsappOrdersTable.id, id));

          for (const order of rows) {
            const { label, step } = statusMeta(order.paymentStatus);
            results.push({
              type: "order",
              ref: `ORD-${order.id}`,
              status: order.paymentStatus,
              statusLabel: label,
              step,
              planName: order.planName,
              planCategory: "",
              planSpeed: "",
              priceMonthly: 0,
              customerName: order.customerName,
              customerEmail: order.customerEmail ?? "",
              address: order.address,
              createdAt: order.createdAt,
              cancelledAt: null,
              paymentMethod: order.paymentMethod,
            });
          }
        }
      }
    }

    if (results.length === 0) {
      res.status(404).json({ error: "No orders or subscriptions found for that email or reference." });
      return;
    }

    res.json({ results });
  } catch (err) {
    req.log.error({ err }, "Failed to track order");
    res.status(500).json({ error: "Failed to look up order. Please try again." });
  }
});

export default router;
