import { Router } from "express";
import { getAllLanguages } from "../controllers/language.controller";

const router = Router();

router.get("/", getAllLanguages);

export default router;