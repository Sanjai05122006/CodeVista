import { Router } from "express";
import {
  chat,
  getThreadMessages,
  saveBatch,
} from "../controllers/chat.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { optionalAuthMiddleware } from "../middleware/optional-auth.middleware";
import {
  expensiveEndpointRateLimits,
  validateChatBatchRequest,
  validateChatRequest,
} from "../middleware/rateLimit.middleware";

const router = Router();

router.post(
  "/",
  optionalAuthMiddleware,
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
