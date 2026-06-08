import { Router, type IRouter } from "express";
import healthRouter from "./health";
import plansRouter from "./plans";
import subscriptionsRouter from "./subscriptions";
import checkoutRouter from "./checkout";
import adminRouter from "./admin";
import walletRouter from "./wallet";
import authRouter from "./auth";
import whatsappOrdersRouter from "./whatsapp-orders";
import whatsappWebhookRouter from "./whatsapp-webhook";
import paystackRouter from "./paystack";
import tokenActivationRouter from "./token-activation";
import supportRouter from "./support";
import trackRouter from "./track";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(plansRouter);
router.use(subscriptionsRouter);
router.use(checkoutRouter);
router.use(adminRouter);
router.use(walletRouter);
router.use(whatsappOrdersRouter);
router.use(whatsappWebhookRouter);
router.use(paystackRouter);
router.use(tokenActivationRouter);
router.use(supportRouter);
router.use(trackRouter);

export default router;
