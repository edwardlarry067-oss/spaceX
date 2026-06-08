import { Router } from "express";
import { db } from "@workspace/db";
import {
  subscriptionsTable,
  plansTable,
  walletsTable,
  walletTransactionsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { BUNDLES } from "../utils/bundleMapper";
import { requireAuth } from "./auth";
import {
  sendSubscriptionConfirmation,
  sendPaymentReceipt,
  sendAdminPaymentAlert,
} from "../lib/email";

const router = Router();

const PSK = () => process.env["PAYSTACK_SECRET_KEY"] ?? "";
const PSK_BASE = "https://api.paystack.co";
const DEFAULT_CURRENCY = process.env["PAYSTACK_CURRENCY"] ?? "USD";

const SUPPORTED_CURRENCIES = new Set(["NGN", "USD", "GHS", "ZAR", "KES"]);

function resolveCurrency(requested?: string): string {
  if (requested && SUPPORTED_CURRENCIES.has(requested.toUpperCase())) {
    return requested.toUpperCase();
  }
  return DEFAULT_CURRENCY;
}

const APP_URL = (() => {
  const url = process.env["APP_URL"] ?? process.env["REPLIT_DEV_DOMAIN"];
  if (url) return url.startsWith("http") ? url : `https://${url}`;
  return "https://www.orbitfuture.com";
})();

const PLAN_PRICES: Record<number, { name: string; priceMonthly: number; speed: string }> = {
  1: { name: "Starlink Residential", priceMonthly: 120, speed: "25–100 Mbps" },
  2: { name: "Starlink Roam", priceMonthly: 150, speed: "25–100 Mbps" },
  3: { name: "Starlink Mobile Priority", priceMonthly: 50, speed: "5–50 Mbps" },
  4: { name: "Starlink Priority (40GB)", priceMonthly: 250, speed: "40–220 Mbps" },
  5: { name: "Starlink Priority (1TB)", priceMonthly: 500, speed: "40–220 Mbps" },
  6: { name: "Starlink Priority (6TB)", priceMonthly: 1500, speed: "100–350 Mbps" },
  7: { name: "Starlink Maritime (50GB)", priceMonthly: 250, speed: "40–220 Mbps" },
  8: { name: "Starlink Maritime (1TB)", priceMonthly: 1000, speed: "100–350 Mbps" },
  9: { name: "Starlink Aviation", priceMonthly: 12500, speed: "40–350 Mbps" },
};

function paystackHeaders() {
  return {
    Authorization: `Bearer ${PSK()}`,
    "Content-Type": "application/json",
  };
}

function toSubunit(amount: number): number {
  return Math.round(amount * 100);
}

function uniqueRef(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function paystackInit(body: Record<string, unknown>) {
  const r = await fetch(`${PSK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: paystackHeaders(),
    body: JSON.stringify(body),
  });
  return r.json() as Promise<{ status: boolean; message: string; data?: { authorization_url: string; access_code: string; reference: string } }>;
}

async function paystackVerify(reference: string) {
  const r = await fetch(`${PSK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: paystackHeaders(),
  });
  return r.json() as Promise<{
    status: boolean;
    message: string;
    data?: {
      status: string;
      reference: string;
      amount: number;
      currency: string;
      metadata?: Record<string, string>;
      customer?: { email: string };
    };
  }>;
}

// ── Wallet helpers ────────────────────────────────────────────────────────────

async function getOrCreateWallet(email: string) {
  const [existing] = await db.select().from(walletsTable).where(eq(walletsTable.email, email)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(walletsTable).values({ email, balance: 0 }).returning();
  return created;
}

async function creditTokensViaPaystack(
  email: string,
  tokens: number,
  bundleName: string,
  reference: string,
) {
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

// ── POST /api/paystack-token-buy ──────────────────────────────────────────────
router.post("/paystack-token-buy", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const { bundleId } = req.body as { bundleId: string };
    if (!bundleId) { res.status(400).json({ error: "bundleId is required" }); return; }

    const key = PSK();
    if (!key) { res.status(503).json({ error: "Payment gateway not configured." }); return; }

    const bundle = BUNDLES.find((b) => b.id === bundleId);
    if (!bundle) { res.status(400).json({ error: "Invalid bundleId" }); return; }

    const amountUsd = bundle.prices["USD"];
    const reference = uniqueRef("tok");

    const result = await paystackInit({
      email: req.user.email,
      amount: toSubunit(amountUsd),
      currency: CURRENCY,
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

    if (!result.status || !result.data?.authorization_url) {
      res.status(500).json({ error: result.message || "Failed to create payment link" });
      return;
    }

    res.json({ paymentLink: result.data.authorization_url, reference });
  } catch (err) {
    req.log?.error?.({ err }, "paystack-token-buy error");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// ── POST /api/paystack-token-verify ──────────────────────────────────────────
router.post("/paystack-token-verify", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const { reference } = req.body as { reference: string };
    if (!reference) { res.status(400).json({ error: "reference is required" }); return; }

    const result = await paystackVerify(reference);
    if (!result.status || result.data?.status !== "success") {
      res.status(400).json({ error: "Payment not completed", status: result.data?.status });
      return;
    }

    const meta = result.data.metadata ?? {};
    if (meta.type !== "token_bundle") {
      res.status(400).json({ error: "Invalid transaction type" });
      return;
    }

    const [existing] = await db
      .select()
      .from(walletTransactionsTable)
      .where(eq(walletTransactionsTable.reference, reference))
      .limit(1);

    const tokens = parseInt(meta.tokens ?? "0") || 0;
    const bundleName = meta.bundleName ?? "Bundle";
    const email = meta.customerEmail ?? req.user.email;

    if (existing) {
      const wallet = await getOrCreateWallet(email);
      res.json({ success: true, tokensAdded: tokens, newBalance: wallet.balance, alreadyProcessed: true });
      return;
    }

    const newBalance = await creditTokensViaPaystack(email, tokens, bundleName, reference);

    sendAdminPaymentAlert({
      type: "token",
      customerName: email,
      customerEmail: email,
      item: `${bundleName} — ${tokens.toLocaleString()} tokens`,
      amountPaid: (result.data.amount ?? 0) / 100,
      currency: result.data.currency ?? CURRENCY,
      transactionId: reference,
    }).catch(() => {});

    res.json({ success: true, tokensAdded: tokens, newBalance });
  } catch (err) {
    req.log?.error?.({ err }, "paystack-token-verify error");
    res.status(500).json({ error: "Verification failed" });
  }
});

// ── POST /api/paystack-plan-pay ───────────────────────────────────────────────
router.post("/paystack-plan-pay", async (req, res): Promise<void> => {
  try {
    const { planId, email, name, address, currency: requestedCurrency } = req.body as {
      planId: number;
      email: string;
      name: string;
      address?: string;
      currency?: string;
    };

    if (!planId || !email?.trim() || !name?.trim()) {
      res.status(400).json({ error: "planId, email, and name are required" });
      return;
    }

    const key = PSK();
    if (!key) {
      res.status(503).json({ error: "Payment gateway not configured. Please contact support." });
      return;
    }

    const currency = resolveCurrency(requestedCurrency);

    let planName: string;
    let priceMonthly: number;
    let planSpeed: string;
    let hardwarePrice = 0;
    let planCategory = "";
    let localPrices: Record<string, { monthly: number; hardware?: number }> | null = null;

    try {
      const [dbPlan] = await db.select().from(plansTable).where(eq(plansTable.id, planId)).limit(1);
      if (dbPlan) {
        planName = dbPlan.name;
        priceMonthly = parseFloat(String(dbPlan.priceMonthly));
        planSpeed = dbPlan.speed;
        hardwarePrice = dbPlan.hardwarePrice ? parseFloat(String(dbPlan.hardwarePrice)) : 0;
        planCategory = dbPlan.category;
        localPrices = (dbPlan.localPrices as Record<string, { monthly: number; hardware?: number }>) ?? null;
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

    // Use local currency pricing if available (e.g. NGN for Nigeria)
    let chargeAmount: number;
    let chargeHardware: number = hardwarePrice;
    if (currency !== "USD" && localPrices?.[currency]) {
      chargeAmount = localPrices[currency].monthly;
      chargeHardware = localPrices[currency].hardware ?? 0;
    } else {
      chargeAmount = priceMonthly;
    }

    const totalAmount = chargeAmount + chargeHardware;
    const reference = uniqueRef("plan");

    const safeEmail = encodeURIComponent(email.trim());
    const safeName = encodeURIComponent(name.trim());
    const safeAddr = encodeURIComponent(address?.trim() ?? "");

    const result = await paystackInit({
      email: email.trim(),
      amount: toSubunit(totalAmount),
      currency,
      reference,
      callback_url: `${APP_URL}/plans?paystack_success=1&reference=${reference}&plan_id=${planId}&email=${safeEmail}&name=${safeName}&address=${safeAddr}`,
      metadata: {
        planId: String(planId),
        planName,
        planSpeed,
        planCategory,
        customerName: name.trim(),
        customerEmail: email.trim(),
        address: address?.trim() ?? "",
        hardwarePrice: String(chargeHardware),
        currency,
      },
    });

    if (!result.status || !result.data?.authorization_url) {
      res.status(500).json({ error: result.message || "Failed to create payment link" });
      return;
    }

    res.json({ paymentLink: result.data.authorization_url, reference });
  } catch (err) {
    req.log?.error?.({ err }, "paystack-plan-pay error");
    res.status(500).json({ error: "Failed to generate payment link" });
  }
});

// ── POST /api/paystack-plan-verify ────────────────────────────────────────────
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

    const result = await paystackVerify(reference);
    if (!result.status || result.data?.status !== "success") {
      res.status(400).json({ error: "Payment not completed", status: result.data?.status });
      return;
    }

    const meta = result.data.metadata ?? {};
    const planIdNum = parseInt(plan_id ?? meta.planId ?? "0") || 0;
    const customerEmail = email ?? meta.customerEmail ?? result.data.customer?.email ?? "";
    const customerName = name ?? meta.customerName ?? "";
    const customerAddress = address ?? meta.address ?? "";
    const planName = meta.planName ?? PLAN_PRICES[planIdNum]?.name ?? "Starlink Plan";
    const planSpeed = meta.planSpeed ?? PLAN_PRICES[planIdNum]?.speed ?? "";
    const planCategory = meta.planCategory ?? "";
    const amountPaid = (result.data.amount ?? 0) / 100;
    const currency = result.data.currency ?? CURRENCY;

    const [existingSub] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.stripeSessionId, reference))
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
            stripeSessionId: reference,
          })
          .returning();
        subscriptionId = sub?.id ?? null;

        if (sub) {
          const [dbPlan] = await db.select().from(plansTable).where(eq(plansTable.id, planIdNum)).limit(1);
          const planFeatures = (dbPlan?.features as string[]) ?? [];

          sendSubscriptionConfirmation({
            customerName,
            customerEmail,
            planName,
            planCategory: planCategory || dbPlan?.category || "",
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
            currency,
            transactionId: reference,
            date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
          }).catch(() => {});

          sendAdminPaymentAlert({
            type: "plan",
            customerName,
            customerEmail,
            item: planName,
            amountPaid,
            currency,
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
        currency,
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

// ── POST /api/paystack-webhook ────────────────────────────────────────────────
router.post("/paystack-webhook", async (req, res): Promise<void> => {
  // Always acknowledge immediately — Paystack requires a fast 200
  res.sendStatus(200);

  try {
    const crypto = await import("node:crypto");
    const secret = PSK();

    // req.body is a raw Buffer (express.raw middleware set in app.ts)
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    const rawBodyStr = rawBody.toString("utf8");

    // Signature verification — compare HMAC-SHA512 of the raw body
    const hash = crypto
      .createHmac("sha512", secret)
      .update(rawBodyStr)
      .digest("hex");

    const incomingSig = req.headers["x-paystack-signature"] as string | undefined;
    if (!incomingSig || hash !== incomingSig) {
      req.log?.warn({ incomingSig: incomingSig?.slice(0, 12) }, "Paystack webhook: signature mismatch — ignored");
      return;
    }

    // Parse event from the raw body
    let event: { event: string; data: Record<string, unknown> };
    try {
      event = JSON.parse(rawBodyStr);
    } catch {
      req.log?.warn("Paystack webhook: failed to parse JSON body");
      return;
    }

    req.log?.info({ event: event.event }, "Paystack webhook received");

    if (event.event !== "charge.success") return;

    const data = event.data as {
      status: string;
      reference: string;
      amount: number;
      currency: string;
      metadata?: Record<string, string>;
      customer?: { email: string };
    };

    if (data.status !== "success") return;

    const meta = data.metadata ?? {};
    const reference = data.reference;
    const eventCurrency = data.currency ?? DEFAULT_CURRENCY;

    // ── Token bundle purchase ─────────────────────────────────────────────────
    if (meta.type === "token_bundle") {
      const email = meta.customerEmail ?? data.customer?.email ?? "";
      const tokens = parseInt(meta.tokens ?? "0") || 0;
      const bundleName = meta.bundleName ?? "Bundle";

      if (!email || tokens <= 0) return;

      const [existing] = await db
        .select()
        .from(walletTransactionsTable)
        .where(eq(walletTransactionsTable.reference, reference))
        .limit(1);

      if (!existing) {
        await creditTokensViaPaystack(email, tokens, bundleName, reference).catch((err) => {
          req.log?.error({ err, reference }, "Webhook: failed to credit tokens");
        });
        req.log?.info({ email, tokens, bundleName, reference }, "Webhook: tokens credited");
      } else {
        req.log?.info({ reference }, "Webhook: token bundle already processed — skipped");
      }
      return;
    }

    // ── Plan subscription purchase ────────────────────────────────────────────
    const planIdNum = parseInt(meta.planId ?? "0") || 0;
    const customerEmail = meta.customerEmail ?? data.customer?.email ?? "";
    const customerName = meta.customerName ?? "";
    const customerAddress = meta.address ?? "";
    const planName = meta.planName ?? PLAN_PRICES[planIdNum]?.name ?? "Starlink Plan";
    const planSpeed = meta.planSpeed ?? PLAN_PRICES[planIdNum]?.speed ?? "";
    const planCategory = meta.planCategory ?? "";
    const amountPaid = (data.amount ?? 0) / 100;

    if (!planIdNum || !customerEmail) {
      req.log?.warn({ reference, planIdNum, customerEmail }, "Webhook: missing planId or email — skipped");
      return;
    }

    // Idempotency: skip if already activated (via verify or a previous webhook)
    const [existingSub] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.stripeSessionId, reference))
      .limit(1);

    if (existingSub) {
      req.log?.info({ reference, subscriptionId: existingSub.id }, "Webhook: subscription already exists — skipped");
      return;
    }

    // Insert subscription
    const [sub] = await db
      .insert(subscriptionsTable)
      .values({
        email: customerEmail,
        name: customerName,
        planId: planIdNum,
        status: "active",
        address: customerAddress,
        amountPaid: String(amountPaid),
        stripeSessionId: reference,
      })
      .returning();

    req.log?.info(
      { reference, subscriptionId: sub?.id, planId: planIdNum, email: customerEmail },
      "Webhook: subscription activated"
    );

    if (!sub) return;

    // Fire confirmation + receipt emails asynchronously (non-blocking)
    const [dbPlan] = await db.select().from(plansTable).where(eq(plansTable.id, planIdNum)).limit(1).catch(() => [null]);
    const planFeatures = (dbPlan?.features as string[]) ?? [];

    sendSubscriptionConfirmation({
      customerName,
      customerEmail,
      planName,
      planCategory: planCategory || dbPlan?.category || "",
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
      currency: eventCurrency,
      transactionId: reference,
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    }).catch(() => {});

    sendAdminPaymentAlert({
      type: "plan",
      customerName,
      customerEmail,
      item: planName,
      amountPaid,
      currency: eventCurrency,
      transactionId: reference,
    }).catch(() => {});

  } catch (err) {
    req.log?.error({ err }, "Paystack webhook: unhandled error");
  }
});

export default router;
