import { Router } from "express";
import resumeController from "../controllers/resume.controller.js";
import { authToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get('/summaries/:cat', authToken, resumeController.getSummaries);
router.get('/summary/:sid', authToken, resumeController.getSummaryById);
router.get('/active/summary', authToken, resumeController.getActiveSummary);
router.post('/create/:cat', authToken, resumeController.createSummary);
router.put('/end/:rid', authToken, resumeController.endDay);
router.put('/add/expense/:rid', authToken, resumeController.addExpense);
router.put('/delete/expense/:rid', resumeController.deleteExpense);

export default router;