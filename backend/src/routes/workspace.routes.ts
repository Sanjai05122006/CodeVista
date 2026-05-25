import { Router } from "express";
import { runWorkspace } from "../controllers/workspace.controller";
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
if (!env.ALLOW_ANONYMOUS_WORKSPACE) {
  router.use(requireAuthenticatedAccess);
}
router.post(
  "/",
  expensiveEndpointRateLimits.workspace,
  validateExecutionRequest,
  runWorkspace
);

export default router;
