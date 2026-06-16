import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middleware/error.middleware";

import executionRoutes from "./routes/execution.routes";
import analysisRoutes from "./routes/analysis.routes";
import languageRoutes from "./routes/language.routes";
import sessionRoutes from "./routes/session.routes";
import historyRoutes from "./routes/history.routes";
import chatRoutes from "./routes/chat.routes";
import contactRoutes from "./routes/contact.routes";
import workspaceRoutes from "./routes/workspace.routes";
import authRoutes from "./routes/auth.routes";
import { MAX_JSON_BODY_SIZE } from "./middleware/rateLimit.middleware";
import { buildTrustedFrontendOrigins } from "./utils/frontend-origins";

const app = express();
const apiRouter = express.Router();

app.set("trust proxy", 1);
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: buildTrustedFrontendOrigins(),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});
app.use(express.json({ limit: MAX_JSON_BODY_SIZE }));

const buildHealthPayload = () => ({
  status: "ok" as const,
  service: "backend" as const,
  version: "0.1.0",
  uptime_seconds: Math.round(process.uptime()),
  timestamp: new Date().toISOString(),
});

app.get("/", (req, res) => {
  res.json({
    status: "running",
    version: "0.1.0",
    endpoints: [
      "POST /api/execution",
      "POST /api/analysis",
      "POST /api/workspace",
      "GET /api/languages",
      "GET /api/uptime",
      "POST /api/session/save",
      "GET /api/session/history",
      "POST /api/chat",
      "POST /api/chat/batch",
      "POST /api/contact/send",
      "POST /api/auth/password/reset/request",
    ],
  });
});

app.get("/healthz", (_req, res) => {
  res.status(200).json(buildHealthPayload());
});

apiRouter.get("/uptime", (_req, res) => {
  res.status(200).json(buildHealthPayload());
});

apiRouter.get("/healthz", (_req, res) => {
  res.status(200).json(buildHealthPayload());
});

apiRouter.use("/execution", executionRoutes);
apiRouter.use("/analysis", analysisRoutes);
apiRouter.use("/workspace", workspaceRoutes);
apiRouter.use("/languages", languageRoutes);
apiRouter.use("/session", sessionRoutes);
apiRouter.use("/history", historyRoutes);
apiRouter.use("/chat", chatRoutes);
apiRouter.use("/contact", contactRoutes);
apiRouter.use("/auth", authRoutes);

app.use("/api", apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: "NOT_FOUND" });
});

app.use(errorHandler); 

export default app;
