import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const isDev = process.env.NODE_ENV !== "production";

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: isDev
      ? true
      : (origin, cb) => {
          if (!origin) return cb(null, true);
          const allowed = [
            "https://orbitfuture.store",
            "https://www.orbitfuture.store",
            "https://orbitfuture.com",
            "https://www.orbitfuture.com",
            "https://fairy-2ff969.netlify.app",
            "https://space-x-puce.vercel.app",
            ...ALLOWED_ORIGINS,
          ];
          // Allow any replit.app, netlify.app, or vercel.app subdomain
          if (
            origin.endsWith(".replit.app") ||
            origin.endsWith(".netlify.app") ||
            origin.endsWith(".vercel.app") ||
            allowed.some((o) => origin.startsWith(o))
          ) {
            cb(null, true);
          } else {
            cb(new Error("CORS: origin not allowed"));
          }
        },
    credentials: true,
  })
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

// Security: reject requests that look like HTTP parameter pollution
app.use((req, _res, next) => {
  if (req.url && req.url.includes("%00")) {
    _res.status(400).json({ error: "Bad request" });
    return;
  }
  next();
});

// Standard JSON parsing for all other routes
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use("/api", router);

// In production, serve the built frontend static files
if (process.env.NODE_ENV === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const frontendDist = path.resolve(__dirname, "../../spacex-starlink/dist");
  app.use(express.static(frontendDist));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;
