// server/src/index.ts
import express, { Application } from "express";
import helmet from "helmet";
import cors, { CorsOptions } from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { env } from "./env";
import generateRouter from "./routes/generate";
import { errorHandler } from "./utils/error";

const app: Application = express();

// Behind proxies (rate limiter IPs, etc.)
app.set("trust proxy", 1);

// Security & middleware
app.use(helmet());
const corsOptions: CorsOptions =
  env.NODE_ENV === "development" ? { origin: "*" } : { origin: false };
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 60, // 60 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use(limiter);

// Routes
app.use("/api/generate-quiz", generateRouter);

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// Central error handler
app.use(errorHandler);

// Start
const port = env.PORT;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`);
});

export default app;
