import { Router } from "express";
import { db } from "@workspace/db";
import { subscriptionsTable, plansTable, walletsTable, walletTransactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { BUNDLES } from "../utils/bundleMapper";
import { requireAuth } from "./auth";
import { sendSubscriptionConfirmation, sendPaymentReceipt, sendAdminPaymentAlert } from "../lib/email";
import crypto from "node:crypto";

const router = Router();

const PAYSTACK_BASE = "https://api.paystack.co";

function getPaystackKey(): string {
  const key = process.env["PAYSTACK_SECRET_KEY"] ?? "";
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  return key;
}

const APP_URL = (() => {
  const url = process.env["APP_URL"] ?? process.env["REPLIT_DEV_DOMAIN"];
  if (url) return url.startsWith("http") ? url : `https://${url}`;
  return "https://www.orbitfuture.com";
})();

const PLAN_PRICES: Record<number, { name: string; priceMonthly: number; speed: string }> = {
  1: { name: "Starlink Best Effort",   priceMonthly: 90,   speed: "5–100 Mbps" },
  2: { name: "Starlink Standard",      priceMonthly: 120,  speed: "50–250 Mbps" },
  3: { name: "Starlink Standard Plus", priceMonthly: 150,  speed: "100–300 Mbps" },
  4: { name: "Starlink Roam",          priceMonthly: 150,  speed: "50–200 Mbps" },
  5: { name: "Starlink Maritime",      priceMonthly: 250,  speed: "100–350 Mbps" },
  6: { name: "Starlink Aviation",      priceMonthly: 500,  speed: "100–350 Mbps" },
  7: { name: "Starlink Business",      priceMonthly: 500,  speed: "200–500 Mbps" },
  8: { name: "Starlink Enterprise",    priceMonthly: 1500, speed: "500 Mbps–1 Gbps" },
  9: { name: "Starlink Global Elite",  priceMonthly: 3000, speed: "1 Gbps+" },
};

function generateRef(prefix: string): string {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
}

async function paystackInitialize(payload: {
  email: string;
  amount: number;
  currency?: string;
  reference: string;
  callback_url: string;
  metadata: Record<string, unknown>;
}): Promise<{ authorization_url: string; reference: string }> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getPaystackKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...payload, currency: payload.currency ?? "USD" }),
  });
  const json = await res.json() as Record<string, unknown>;
  if (!json.status) throw new Error((json.message as string) ?? "Paystack initialization failed");
  const data = json.data as Record<string, string>;
  return { authorization_url: data.authorization_url, reference: data.reference };
}

async function paystackVerify(reference: string): Promise<{
  status: string;
  amount: number;
  currency: string;
  customer: { email: string };
  metadata: Record<string, unknown>;
}> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${getPaystackKey()}` },
  });
  const json = await res.json() as Record<string, unknown>;
  if (!json.status) throw new Error((json.message as string) ?? "Paystack verification failed");
  return json.data as {
    status: string;
    amount: number;
    currency: string;
    customer: { email: string };
    metadata: Record<string, unknown>;
  };
}

// ── Wallet helpers ─────────────────────────────────────────────────────────────

async function getOrCreateWallet(email: string) {
  const [existing] = await db.select().from(walletsTable).where(eq(walletsTable.email, email)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(walletsTable).values({ email, balance: 0 }).returning();
  return created;
}

async function creditTokens(email: string, tokens: number, bundleName: string, reference: string) {
  const wallet = await getOrCreateWallet(email);
  const [updated] = await db
    .update(walletsTable)
    .set({ balance: wallet.balance + tokens, updatedAt: new Date() })
    .where(eq(walletsTable.id, wallet.id))
    .returning();
  await db.insert(walletTransactionsTable).values({
    walletId: wallet.id,
    type: "credit",
    amount: tokens,
    description: `Paystack: ${bundleName} bundle — ${tokens} tokens`,
    reference,
    status: "completed",
    metadata: { source: "paystack", bundleName, reference },
  });
  return updated.balance;
}

// POST /api/paystack-token-buy
router.post("/paystack-token-buy", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const { bundleId } = req.body as { bundleId: string };
    if (!bundleId) { res.status(400).json({ error: "bundleId is required" }); return; }

    const paystackKey = process.env["PAYSTACK_SECRET_KEY"];
    if (!paystackKey) { res.status(503).json({ error: "Payment gateway not configured." }); return; }

    const bundle = BUNDLES.find((b) => b.id === bundleId);
    if (!bundle) { res.status(400).json({ error: "Invalid bundleId" }); return; }

    const amountUsd = bundle.prices["USD"];
    const reference = generateRef("tok");

    const { authorization_url } = await paystackInitialize({
      email: req.user.email,
      amount: Math.round(amountUsd * 100),
      currency: "USD",
      reference,
      callback_url: `${APP_URL}/wallet?paystack_token_success=1&reference=${reference}`,
      metadata: {
        type: "token_bundle",
        bundleId: bundle.id,
        bundleName: bundle.name,
        tokens: String(bundle.tokens),
        userId: String(req.user.userId),
        customerEmail: req.user.email,
      },
    });

    res.json({ paymentLink: authorization_url, reference });
  } catch (err) {
    req.log?.error?.({ err }, "paystack-token-buy error");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// POST /api/paystack-token-verify
router.post("/paystack-token-verify", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const { reference } = req.body as { reference: string };
    if (!reference) { res.status(400).json({ error: "reference is required" }); return; }

    const tx = await paystackVerify(reference);
    if (tx.status !== "success") {
      res.status(400).json({ error: "Payment not completed", status: tx.status });
      return;
    }

    const meta = tx.metadata ?? {};
    if (meta.type !== "token_bundle") {
      res.status(400).json({ error: "Invalid transaction type" });
      return;
    }

    // Idempotency: skip if already processed
    const [existing] = await db
      .select()
      .from(walletTransactionsTable)
      .where(eq(walletTransactionsTable.reference, reference))
      .limit(1);

    const tokens = parseInt(String(meta.tokens ?? "0")) || 0;
    const bundleName = String(meta.bundleName ?? "Bundle");
    const email = String(meta.customerEmail ?? req.user.email);

    if (existing) {
      const wallet = await getOrCreateWallet(email);
      res.json({ success: true, tokensAdded: tokens, newBalance: wallet.balance, alreadyProcessed: true });
      return;
    }

    const newBalance = await creditTokens(email, tokens, bundleName, reference);

    sendAdminPaymentAlert({
      type: "token",
      customerName: email,
      customerEmail: email,
      item: `${bundleName} — ${tokens.toLocaleString()} tokens`,
      amountPaid: tx.amount / 100,
      currency: tx.currency?.toUpperCase() ?? "USD",
      transactionId: reference,
    }).catch(() => {});

    res.json({ success: true, tokensAdded: tokens, newBalance });
  } catch (err) {
    req.log?.error?.({ err }, "paystack-token-verify error");
    res.status(500).json({ error: "Verification failed" });
  }
});

// POST /api/paystack-plan-pay
router.post("/paystack-plan-pay", async (req, res): Promise<void> => {
  try {
    const { planId, email, name, address } = req.body as {
      planId: number;
      email: string;
      name: string;
      address?: string;
    };

    if (!planId || !email?.trim() || !name?.trim()) {
      res.status(400).json({ error: "planId, email, and name are required" });
      return;
    }

    const paystackKey = process.env["PAYSTACK_SECRET_KEY"];
    if (!paystackKey) {
      res.status(503).json({ error: "Payment gateway not configured. Please contact support." });
      return;
    }

    let planName: string;
    let priceMonthly: number;
    let planSpeed: string;
    let hardwarePrice = 0;

    try {
      const [dbPlan] = await db.select().from(plansTable).where(eq(plansTable.id, planId)).limit(1);
      if (dbPlan) {
        planName = dbPlan.name;
        priceMonthly = parseFloat(String(dbPlan.priceMonthly));
        planSpeed = dbPlan.speed;
        hardwarePrice = dbPlan.hardwarePrice ? parseFloat(String(dbPlan.hardwarePrice)) : 0;
      } else {
        throw new Error("not in db");
      }
    } catch {
      const fallback = PLAN_PRICES[planId];
      if (!fallback) { res.status(404).json({ error: "Plan not found" }); return; }
      planName = fallback.name;
      priceMonthly = fallback.priceMonthly;
      planSpeed = fallback.speed;
    }

    const totalAmount = priceMonthly + hardwarePrice;
    const reference = generateRef("plan");
    const safeEmail = encodeURIComponent(email.trim());
    const safeName  = encodeURIComponent(name.trim());
    const safeAddr  = encodeURIComponent(address?.trim() ?? "");

    const { authorization_url } = await paystackInitialize({
      email: email.trim(),
      amount: Math.round(totalAmount * 100),
      currency: "USD",
      reference,
      callback_url: `${APP_URL}/plans?paystack_success=1&plan_id=${planId}&email=${safeEmail}&name=${safeName}&address=${safeAddr}&reference=${reference}`,
      metadata: {
        planId: String(planId),
        planName,
        planSpeed,
        customerName: name.trim(),
        customerEmail: email.trim(),
        address: address?.trim() ?? "",
        totalAmount: String(totalAmount),
      },
    });

    res.json({ paymentLink: authorization_url, reference });
  } catch (err) {
    req.log?.error?.({ err }, "paystack-plan-pay error");
    res.status(500).json({ error: "Failed to generate payment link" });
  }
});

// POST /api/paystack-plan-verify
router.post("/paystack-plan-verify", async (req, res): Promise<void> => {
  try {
    const { reference, plan_id, email, name, address } = req.body as {
      reference: string;
      plan_id?: string;
      email?: string;
      name?: string;
      address?: string;
    };

    if (!reference) {
      res.status(400).json({ error: "reference is required" });
      return;
    }

    const tx = await paystackVerify(reference);
    if (tx.status !== "success") {
      res.status(400).json({ error: "Payment not completed", status: tx.status });
      return;
    }

    const meta = tx.metadata ?? {};
    const planIdNum       = parseInt(plan_id ?? String(meta.planId ?? "0")) || 0;
    const customerEmail   = email ?? String(meta.customerEmail ?? tx.customer.email ?? "");
    const customerName    = name ?? String(meta.customerName ?? "");
    const customerAddress = address ?? String(meta.address ?? "");
    const planName        = String(meta.planName ?? PLAN_PRICES[planIdNum]?.name ?? "Starlink Plan");
    const planSpeed       = String(meta.planSpeed ?? PLAN_PRICES[planIdNum]?.speed ?? "");
    const amountPaid      = tx.amount / 100;

    // Idempotency: check if already processed
    const [existingSub] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.paystackReference, reference))
      .limit(1);

    let subscriptionId: number | null = existingSub?.id ?? null;

    if (!existingSub) {
      try {
        const [sub] = await db
          .insert(subscriptionsTable)
          .values({
            email: customerEmail,
            name: customerName,
            planId: planIdNum,
            status: "active",
            address: customerAddress,
            amountPaid: String(amountPaid),
            paystackReference: reference,
          })
          .returning();
        subscriptionId = sub?.id ?? null;

        if (sub) {
          const [dbPlan] = await db.select().from(plansTable).where(eq(plansTable.id, planIdNum)).limit(1);
          const planFeatures = (dbPlan?.features as string[]) ?? [];
          const planCategory = dbPlan?.category ?? "";

          sendSubscriptionConfirmation({
            customerName,
            customerEmail,
            planName,
            planCategory,
            planSpeed,
            priceMonthly: amountPaid,
            features: planFeatures,
            subscriptionId: sub.id,
          }).catch(() => {});

          sendPaymentReceipt({
            customerName,
            customerEmail,
            planName,
            amountPaid,
            currency: tx.currency?.toUpperCase() ?? "USD",
            transactionId: reference,
            date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
          }).catch(() => {});

          sendAdminPaymentAlert({
            type: "plan",
            customerName,
            customerEmail,
            item: planName,
            amountPaid,
            currency: tx.currency?.toUpperCase() ?? "USD",
            transactionId: reference,
          }).catch(() => {});
        }
      } catch {
        // DB unavailable — still return success
      }
    }

    res.json({
      success: true,
      subscription: {
        id: subscriptionId,
        planName,
        planSpeed,
        email: customerEmail,
        amountPaid,
        currency: tx.currency?.toUpperCase() ?? "USD",
        reference,
        address: customerAddress,
        alreadyProcessed: !!existingSub,
      },
    });
  } catch (err) {
    req.log?.error?.({ err }, "paystack-plan-verify error");
    res.status(500).json({ error: "Verification failed" });
  }
});

// POST /api/paystack-webhook
router.post("/paystack-webhook", express.json(), async (req, res): Promise<void> => {
  res.sendStatus(200);

  try {
    const webhookSecret = process.env["PAYSTACK_WEBHOOK_SECRET"];
    if (webhookSecret) {
      const hash = crypto
        .createHmac("sha512", webhookSecret)
        .update(JSON.stringify(req.body))
        .digest("hex");
      if (hash !== req.headers["x-paystack-signature"]) {
        req.log?.warn("Paystack webhook signature verification failed");
        return;
      }
    }

    const event = req.body as { event: string; data: Record<string, unknown> };
    if (event.event !== "charge.success") return;

    const data = event.data;
    if (data.status !== "success") return;

    const reference = data.reference as string;
    const meta = (data.metadata ?? {}) as Record<string, unknown>;

    // Token bundle purchase
    if (meta.type === "token_bundle") {
      const email  = String(meta.customerEmail ?? (data.customer as Record<string, string>)?.email ?? "");
      const tokens = parseInt(String(meta.tokens ?? "0")) || 0;
      const bundleName = String(meta.bundleName ?? "Bundle");
      if (email && tokens > 0) {
        try {
          const [existing] = await db
            .select()
            .from(walletTransactionsTable)
            .where(eq(walletTransactionsTable.reference, reference))
            .limit(1);
          if (!existing) await creditTokens(email, tokens, bundleName, reference);
        } catch (err) {
          req.log?.error?.({ err }, "Paystack webhook: token credit failed");
        }
      }
      return;
    }

    // Plan subscription purchase
    const planIdNum     = parseInt(String(meta.planId ?? "0")) || 0;
    const customerEmail = String(meta.customerEmail ?? (data.customer as Record<string, string>)?.email ?? "");
    const customerName  = String(meta.customerName ?? "");
    const amountPaid    = (data.amount as number) / 100;

    try {
      await db.insert(subscriptionsTable).values({
        email: customerEmail,
        name: customerName,
        planId: planIdNum,
        status: "active",
        address: String(meta.address ?? ""),
        amountPaid: String(amountPaid),
        paystackReference: reference,
      });
    } catch {
      // Already inserted via verify endpoint or DB unavailable
    }
  } catch (err) {
    req.log?.error?.({ err }, "Paystack webhook processing error");
  }
});

import express from "express";
export default router;
