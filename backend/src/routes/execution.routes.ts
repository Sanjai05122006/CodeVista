import { Router } from "express";
import { runExecution } from "../controllers/execution.controller";
import {
  requireAuthenticatedAccess,
} from "../middleware/auth.middleware";
import { optionalAuthMiddleware } from "../middleware/optional-auth.middleware";
import { env } from "../config/env";
import {
  expensiveEndpointRateLimits,
  validateExecutionRequest,
} from "../middleware/rateLimit.middleware";

const router = Router();

router.use(optionalAuthMiddleware);
if (!env.ALLOW_ANONYMOUS_EXECUTION) {
  router.use(requireAuthenticatedAccess);
}
router.post(
  "/",
  expensiveEndpointRateLimits.execution,
  validateExecutionRequest,
  runExecution
);

export default router;
