import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  getSessionDetailHandler,
  getSessionHistoryHandler,
} from "../controllers/session.controller";

const router = Router();

router.use(authMiddleware);
router.get("/", getSessionHistoryHandler);
router.get("/:id", getSessionDetailHandler);

export default router;
