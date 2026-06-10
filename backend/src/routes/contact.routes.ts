import { Router } from "express";
import {
  recordContactSubmissionHandler,
  sendContactSubmissionHandler,
} from "../controllers/contact.controller";
import {
  expensiveEndpointRateLimits,
  validateContactLogRequest,
  validateContactSendRequest,
} from "../middleware/rateLimit.middleware";

const router = Router();

router.post(
  "/log",
  expensiveEndpointRateLimits.contactLog,
  validateContactLogRequest,
  recordContactSubmissionHandler
);

router.post(
  "/send",
  expensiveEndpointRateLimits.contactSend,
  validateContactSendRequest,
  sendContactSubmissionHandler
);

export default router;
