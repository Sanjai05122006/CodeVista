import { Router } from "express";
import { sendContactSubmissionHandler } from "../controllers/contact.controller";
import {
  expensiveEndpointRateLimits,
  validateContactSendRequest,
} from "../middleware/rateLimit.middleware";

const router = Router();

router.post(
  "/send",
  expensiveEndpointRateLimits.contactSend,
  validateContactSendRequest,
  sendContactSubmissionHandler
);

export default router;
