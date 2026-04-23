import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  getSessionDetailHandler,
  getSessionHistoryHandler,
  saveSessionHandler,
} from "../controllers/session.controller";

const router = Router();

router.use(authMiddleware);
router.post("/save", saveSessionHandler);
router.get("/history", getSessionHistoryHandler);
router.get("/:id", getSessionDetailHandler);

export default router;
