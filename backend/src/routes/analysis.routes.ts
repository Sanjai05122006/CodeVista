import { Router } from "express";
import { runAnalysis } from "../controllers/analysis.controller";
import { optionalAuthMiddleware } from "../middleware/optional-auth.middleware";
import {
  expensiveEndpointRateLimits,
  validateAnalysisRequest,
} from "../middleware/rateLimit.middleware";

const router = Router();

router.use(optionalAuthMiddleware);
router.post(
  "/",
  expensiveEndpointRateLimits.analysis,
  validateAnalysisRequest,
  runAnalysis
);

export default router;
