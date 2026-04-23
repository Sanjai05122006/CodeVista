import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  getChatMessagesHandler,
  saveChatMessageHandler,
} from "../controllers/chat.controller";

const router = Router();

router.use(authMiddleware);
router.post("/messages", saveChatMessageHandler);
router.get("/:sessionId", getChatMessagesHandler);

export default router;
