import { Router } from "express";
import resumeController from "../controllers/resume.controller.js";

const router = Router();

router.post('/create/:cat', resumeController.createSummary);
router.put('/end', resumeController.endDay);

export default router;