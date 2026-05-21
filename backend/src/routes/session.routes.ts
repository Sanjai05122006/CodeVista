import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  getSessionDetailHandler,
  getSessionHistoryHandler,
  saveSessionHandler,
} from "../controllers/session.controller";
import {
  expensiveEndpointRateLimits,
  validateSessionSaveRequest,
} from "../middleware/rateLimit.middleware";

const router = Router();

router.use(authMiddleware);
router.post(
  "/save",
  expensiveEndpointRateLimits.sessionSave,
  validateSessionSaveRequest,
  saveSessionHandler
);
router.get("/history", expensiveEndpointRateLimits.sessionRead, getSessionHistoryHandler);
router.get("/:id", expensiveEndpointRateLimits.sessionRead, getSessionDetailHandler);

export default router;
