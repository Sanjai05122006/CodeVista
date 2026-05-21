import { Router } from "express";
import { getAllLanguages } from "../controllers/language.controller";
import { optionalAuthMiddleware } from "../middleware/optional-auth.middleware";
import { expensiveEndpointRateLimits } from "../middleware/rateLimit.middleware";

const router = Router();

router.use(optionalAuthMiddleware);
router.get("/", expensiveEndpointRateLimits.languageList, getAllLanguages);

export default router;
