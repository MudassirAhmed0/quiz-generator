// server/src/index.ts
import express, { Application } from "express";
import helmet, { HelmetOptions } from "helmet";
import cors, { CorsOptions } from "cors";
import morgan from "morgan";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

import { env } from "./env";
import generateRouter from "./routes/generate";
import { errorHandler } from "./utils/error";

export const app: Application = express();

// trust proxy so rate limiter gets real IPs behind proxies
app.set("trust proxy", 1);

/** Helmet (disable CSP in dev for Vite) */
const helmetOptions: HelmetOptions =
  env.NODE_ENV === "development" ? { contentSecurityPolicy: false } : {};
app.use(helmet(helmetOptions));

/** CORS: dev -> DEV_ORIGIN (Vite), prod -> PROD_ORIGIN only */
const devOrigin = process.env.DEV_ORIGIN || "http://localhost:5173";
const prodOrigin = process.env.PROD_ORIGIN || "";
let corsOptions: CorsOptions;
if (env.NODE_ENV === "development") {
  corsOptions = { origin: devOrigin, credentials: true };
} else if (env.NODE_ENV === "test") {
  corsOptions = { origin: "*" };
} else {
  corsOptions = prodOrigin
    ? { origin: prodOrigin, credentials: true }
    : { origin: false };
}
app.use(cors(corsOptions));

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

/** Rate limit: 60 req / 10 min per IP with JSON handler */
app.use(
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: { code: "RATE_LIMITED", message: "Too many requests" },
      });
    },
    keyGenerator: (req) => ipKeyGenerator(req.ip || ""),
  })
);
// Routes
app.use("/api/generate-quiz", generateRouter);
app.get("/health", (_req, res) => res.json({ ok: true }));

// Central error handler
app.use(errorHandler);

// Start server (not during tests)
if (env.NODE_ENV !== "test") {
  const port = env.PORT;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${port}`);
  });
}
