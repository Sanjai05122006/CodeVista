import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import executionRoutes from "./routes/execution.routes";
import languageRoutes from "./routes/language.routes";


dotenv.config();

const app = express();

app.use(cors());

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use(express.json());

// health check
app.get("/", (req, res) => {
  res.send("API is running...");
});

//mount route
app.use("/api/execution", executionRoutes);
app.use("/api/languages", languageRoutes);
export default app;