import { Router } from "express";
import { runExecution } from "../controllers/execution.controller";

const router = Router();

router.post("/", runExecution);

export default router;