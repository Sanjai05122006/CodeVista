import { Router } from "express";
import { requestPasswordResetHandler } from "../controllers/auth.controller";
import { optionalAuthMiddleware } from "../middleware/optional-auth.middleware";
import {
  expensiveEndpointRateLimits,
  validatePasswordResetRequest,
} from "../middleware/rateLimit.middleware";

const router = Router();

router.use(optionalAuthMiddleware);

router.post(
  "/password/reset/request",
  expensiveEndpointRateLimits.passwordResetRequest,
  validatePasswordResetRequest,
  requestPasswordResetHandler
);

export default router;
