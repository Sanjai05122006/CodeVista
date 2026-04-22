import { Router } from "express";
import { runAnalysis } from "../controllers/analysis.controller";

const router = Router();

router.post("/", runAnalysis);

export default router;
