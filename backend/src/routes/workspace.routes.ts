import { Router } from "express";
import { runWorkspace } from "../controllers/workspace.controller";
import { optionalAuthMiddleware } from "../middleware/optional-auth.middleware";
import {
  expensiveEndpointRateLimits,
  validateExecutionRequest,
} from "../middleware/rateLimit.middleware";

const router = Router();

router.use(optionalAuthMiddleware);
router.post(
  "/",
  expensiveEndpointRateLimits.execution,
  validateExecutionRequest,
  runWorkspace
);

export default router;
