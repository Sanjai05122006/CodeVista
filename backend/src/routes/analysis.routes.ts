import { Router } from "express";
import { runAnalysis } from "../controllers/analysis.controller";
import {
  requireAuthenticatedAccess,
} from "../middleware/auth.middleware";
import { optionalAuthMiddleware } from "../middleware/optional-auth.middleware";
import { env } from "../config/env";
import {
  expensiveEndpointRateLimits,
  validateAnalysisRequest,
} from "../middleware/rateLimit.middleware";

const router = Router();

router.use(optionalAuthMiddleware);
if (!env.ALLOW_ANONYMOUS_ANALYSIS) {
  router.use(requireAuthenticatedAccess);
}
router.post(
  "/",
  expensiveEndpointRateLimits.analysis,
  validateAnalysisRequest,
  runAnalysis
);

export default router;
