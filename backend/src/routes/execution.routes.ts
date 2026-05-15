import { Router } from "express";
import { runExecution } from "../controllers/execution.controller";
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
  runExecution
);

export default router;
