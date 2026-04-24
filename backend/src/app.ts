import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error.middleware";

import executionRoutes from "./routes/execution.routes";
import analysisRoutes from "./routes/analysis.routes";
import languageRoutes from "./routes/language.routes";
import sessionRoutes from "./routes/session.routes";
import historyRoutes from "./routes/history.routes";
import chatRoutes from "./routes/chat.routes";

const app = express();
const apiRouter = express.Router();

app.use(
  cors({
    origin: env.FRONTEND_URL,
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
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "running",
    version: "0.1.0",
    endpoints: [
      "POST /api/execution",
      "POST /api/analysis",
      "GET /api/languages",
      "POST /api/session/save",
      "GET /api/session/history",
      "POST /api/chat",
      "POST /api/chat/batch",
    ],
  });
});

apiRouter.use("/execution", executionRoutes);
apiRouter.use("/analysis", analysisRoutes);
apiRouter.use("/languages", languageRoutes);
apiRouter.use("/session", sessionRoutes);
apiRouter.use("/history", historyRoutes);
apiRouter.use("/chat", chatRoutes);

app.use("/api", apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: "NOT_FOUND" });
});

app.use(errorHandler); 

export default app;
