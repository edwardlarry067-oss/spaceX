import { Router } from "express";
import { db } from "@workspace/db";
import { whatsappOrdersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { adminAuth } from "../middlewares/adminAuth";

const router = Router();

const VALID_PAYMENT_METHODS = ["paystack", "wallet"] as const;
const VALID_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;

type PaymentMethod = typeof VALID_PAYMENT_METHODS[number];
type PaymentStatus = typeof VALID_STATUSES[number];

router.get("/admin/whatsapp-orders", adminAuth, async (req, res): Promise<void> => {
  try {
    const orders = await db
      .select()
      .from(whatsappOrdersTable)
      .orderBy(desc(whatsappOrdersTable.createdAt));
    res.json(orders);
  } catch (err) {
    req.log.error({ err }, "Failed to list WhatsApp orders");
    res.status(500).json({ error: "Failed to list orders" });
  }
});

router.post("/admin/whatsapp-orders", adminAuth, async (req, res): Promise<void> => {
  try {
    const b = req.body;
    if (!b.customerName || !b.customerPhone || !b.planName || !b.planPrice) {
      res.status(400).json({ error: "Missing required fields: customerName, customerPhone, planName, planPrice" });
      return;
    }
    const paymentMethod: PaymentMethod = VALID_PAYMENT_METHODS.includes(b.paymentMethod) ? b.paymentMethod : "paystack";
    const paymentStatus: PaymentStatus = VALID_STATUSES.includes(b.paymentStatus) ? b.paymentStatus : "pending";

    const [order] = await db
      .insert(whatsappOrdersTable)
      .values({
        customerName: String(b.customerName),
        customerPhone: String(b.customerPhone),
        customerEmail: b.customerEmail ? String(b.customerEmail) : null,
        planName: String(b.planName),
        planPrice: String(parseFloat(b.planPrice)),
        hardwarePrice: b.hardwarePrice != null && b.hardwarePrice !== "" ? String(parseFloat(b.hardwarePrice)) : null,
        paymentMethod,
        paymentStatus,
        address: b.address ? String(b.address) : null,
        notes: b.notes ? String(b.notes) : null,
      })
      .returning();
    res.status(201).json(order);
  } catch (err) {
    req.log.error({ err }, "Failed to create WhatsApp order");
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.patch("/admin/whatsapp-orders/:id", adminAuth, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
    const b = req.body;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (b.customerName !== undefined) updateData.customerName = String(b.customerName);
    if (b.customerPhone !== undefined) updateData.customerPhone = String(b.customerPhone);
    if (b.customerEmail !== undefined) updateData.customerEmail = b.customerEmail ? String(b.customerEmail) : null;
    if (b.planName !== undefined) updateData.planName = String(b.planName);
    if (b.planPrice !== undefined) updateData.planPrice = String(parseFloat(b.planPrice));
    if (b.hardwarePrice !== undefined) updateData.hardwarePrice = b.hardwarePrice != null && b.hardwarePrice !== "" ? String(parseFloat(b.hardwarePrice)) : null;
    if (b.paymentMethod !== undefined && VALID_PAYMENT_METHODS.includes(b.paymentMethod)) updateData.paymentMethod = b.paymentMethod;
    if (b.paymentStatus !== undefined && VALID_STATUSES.includes(b.paymentStatus)) updateData.paymentStatus = b.paymentStatus;
    if (b.address !== undefined) updateData.address = b.address ? String(b.address) : null;
    if (b.notes !== undefined) updateData.notes = b.notes ? String(b.notes) : null;

    const [order] = await db
      .update(whatsappOrdersTable)
      .set(updateData)
      .where(eq(whatsappOrdersTable.id, id))
      .returning();
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    res.json(order);
  } catch (err) {
    req.log.error({ err }, "Failed to update WhatsApp order");
    res.status(500).json({ error: "Failed to update order" });
  }
});

router.delete("/admin/whatsapp-orders/:id", adminAuth, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
    await db.delete(whatsappOrdersTable).where(eq(whatsappOrdersTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete WhatsApp order");
    res.status(500).json({ error: "Failed to delete order" });
  }
});

export default router;
