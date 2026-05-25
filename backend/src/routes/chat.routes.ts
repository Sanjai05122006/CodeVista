import { Router } from "express";
import {
  chat,
  getThreadMessages,
  saveBatch,
} from "../controllers/chat.controller";
import {
  authMiddleware,
  requireAuthenticatedAccess,
} from "../middleware/auth.middleware";
import { optionalAuthMiddleware } from "../middleware/optional-auth.middleware";
import { env } from "../config/env";
import {
  expensiveEndpointRateLimits,
  validateChatBatchRequest,
  validateChatRequest,
} from "../middleware/rateLimit.middleware";

const router = Router();

router.post(
  "/",
  optionalAuthMiddleware,
  ...(env.ALLOW_ANONYMOUS_CHAT ? [] : [requireAuthenticatedAccess]),
  expensiveEndpointRateLimits.chat,
  validateChatRequest,
  chat
);
router.post(
  "/batch",
  authMiddleware,
  expensiveEndpointRateLimits.chatBatch,
  validateChatBatchRequest,
  saveBatch
);
router.get(
  "/:threadId",
  authMiddleware,
  expensiveEndpointRateLimits.chatRead,
  getThreadMessages
);

export default router;
