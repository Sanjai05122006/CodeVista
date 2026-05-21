import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  getSessionDetailHandler,
  getSessionHistoryHandler,
} from "../controllers/session.controller";
import { expensiveEndpointRateLimits } from "../middleware/rateLimit.middleware";

const router = Router();

router.use(authMiddleware);
router.get("/", expensiveEndpointRateLimits.sessionRead, getSessionHistoryHandler);
router.get("/:id", expensiveEndpointRateLimits.sessionRead, getSessionDetailHandler);

export default router;
