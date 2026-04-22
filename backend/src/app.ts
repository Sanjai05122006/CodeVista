import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error.middleware";

import executionRoutes from "./routes/execution.routes";
import analysisRoutes from "./routes/analysis.routes";
import languageRoutes from "./routes/language.routes";

const app = express();

app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "running",
    version: "0.1.0",
    endpoints: [
      "POST /api/execution",
      "POST /api/analysis",
      "GET /api/languages",
    ],
  });
});

app.use("/api/execution", executionRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/languages", languageRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "NOT_FOUND" });
});

app.use(errorHandler); 

export default app;
