import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/error.middleware";

import executionRoutes from "./routes/execution.routes";
import languageRoutes from "./routes/language.routes";

dotenv.config();
const app = express();

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "running",
    version: "0.1.0",
    endpoints: ["POST /api/execution", "GET /api/languages"],
  });
});

app.use("/api/execution", executionRoutes);
app.use("/api/languages", languageRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "NOT_FOUND" });
});

app.use(errorHandler); // ← ERROR HANDLER LAST

export default app;