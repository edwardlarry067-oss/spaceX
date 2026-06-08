import { Router } from "express";
import { db } from "@workspace/db";
import { whatsappOrdersTable } from "@workspace/db";

const router = Router();

export interface ParsedOrder {
  customerName: string | null;
  customerPhone: string;
  planName: string | null;
  planPrice: string | null;
  hardwarePrice: string | null;
  paymentMethod: "paystack" | "wallet";
  rawMessage: string;
  isOrderRequest: boolean;
}

export function parseWhatsAppMessage(body: string, from: string, profileName?: string): ParsedOrder {
  const phone = from.replace(/^whatsapp:/, "").trim();
  const customerName = profileName && profileName !== "Unknown" ? profileName : null;

  const isOrderRequest =
    body.includes("STARLINK — ORDER REQUEST") ||
    body.includes("STARLINK  ORDER REQUEST");

  let planName: string | null = null;
  let planPrice: string | null = null;
  let hardwarePrice: string | null = null;
  let paymentMethod: "paystack" | "wallet" = "paystack";

  if (isOrderRequest) {
    const planMatch = body.match(/Plan:\*?\s*(.+)/i);
    if (planMatch) planName = planMatch[1].replace(/\*/g, "").trim();

    const priceMatch = body.match(/Monthly Cost:\*?\s*\$?([\d.]+)\s*\/mo/i);
    if (priceMatch) planPrice = priceMatch[1];

    const hwMatch = body.match(/Hardware Kit:\*?\s*\$?([\d.]+)/i);
    if (hwMatch) hardwarePrice = hwMatch[1];

    const prefSection = body.match(/Preferred Payment Method:\*?\s*\n([^\n]+)/i);
    const prefLine = prefSection ? prefSection[1].toLowerCase() : body.toLowerCase();
    if (/paystack|bank transfer|ussd|mobile money/i.test(prefLine)) {
      paymentMethod = "paystack";
    } else if (/orbit wallet|token|wallet/i.test(prefLine)) {
      paymentMethod = "wallet";
    } else {
      paymentMethod = "paystack";
    }
  }

  return { customerName, customerPhone: phone, planName, planPrice, hardwarePrice, paymentMethod, rawMessage: body, isOrderRequest };
}

function twiml(message: string): string {
  const safe = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`;
}

router.post("/webhook/whatsapp", async (req, res): Promise<void> => {
  res.setHeader("Content-Type", "application/xml");
  try {
    const body: string = req.body.Body || "";
    const from: string = req.body.From || "";
    const profileName: string = req.body.ProfileName || "";

    if (!body || !from) {
      res.send(twiml("Message received."));
      return;
    }

    const parsed = parseWhatsAppMessage(body, from, profileName);

    if (!parsed.isOrderRequest || !parsed.planName) {
      res.send(twiml(
        "Hi! Thanks for reaching out to Starlink HQ. " +
        "To place an order, please visit our website and click 'Order via WhatsApp' on your preferred plan. " +
        "A sales agent will follow up shortly. 🌐"
      ));
      return;
    }

    const [order] = await db
      .insert(whatsappOrdersTable)
      .values({
        customerName: parsed.customerName,
        customerPhone: parsed.customerPhone,
        planName: parsed.planName,
        planPrice: parsed.planPrice ?? "0",
        hardwarePrice: parsed.hardwarePrice,
        paymentMethod: parsed.paymentMethod,
        paymentStatus: "pending",
        notes: `Auto-captured via WhatsApp. Raw message stored for reference.`,
      })
      .returning();

    const hw = parsed.hardwarePrice ? ` + $${parsed.hardwarePrice} hardware kit` : "";
    const pmLabel =
      parsed.paymentMethod === "paystack" ? "Paystack"
      : "Orbit Wallet";

    res.send(twiml(
      `✅ *Order Received — #${order.id}*\n\n` +
      `Thanks${parsed.customerName ? ` ${parsed.customerName}` : ""}! We've logged your order:\n\n` +
      `📦 *Plan:* ${parsed.planName}\n` +
      `💰 *Cost:* $${parsed.planPrice}/mo${hw}\n` +
      `💳 *Payment:* ${pmLabel}\n\n` +
      `A Starlink HQ agent will send your payment link within 30 minutes. ` +
      `Your order ID is *#${order.id}*.\n\n` +
      `Questions? Reply here anytime. 🌐`
    ));
  } catch (err) {
    req.log?.error({ err }, "WhatsApp webhook error");
    res.send(twiml("Order received! A Starlink agent will be in touch shortly. 🌐"));
  }
});

router.post("/admin/whatsapp-webhook/test-parse", (req, res): void => {
  const { body, from, profileName } = req.body;
  if (!body || !from) {
    res.status(400).json({ error: "body and from are required" });
    return;
  }
  const result = parseWhatsAppMessage(String(body), String(from), profileName ? String(profileName) : undefined);
  res.json(result);
});

export default router;
