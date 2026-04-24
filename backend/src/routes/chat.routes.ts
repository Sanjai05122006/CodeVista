import { Router } from "express";
import {
  chat,
  getThreadMessages,
  saveBatch,
} from "../controllers/chat.controller";
import { optionalAuthMiddleware } from "../middleware/optional-auth.middleware";

const router = Router();

router.use(optionalAuthMiddleware);
router.post("/", chat);
router.post("/batch", saveBatch);
router.get("/:threadId", getThreadMessages);

export default router;
