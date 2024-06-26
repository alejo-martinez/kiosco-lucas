import { Router } from "express";
import resumeController from "../controllers/resume.controller.js";
import { authToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.post('/create/:cat', authToken, resumeController.createSummary);
router.put('/end/:rid', authToken, resumeController.endDay);
router.put('/add/expense/:rid', authToken, resumeController.addExpense);
router.put('/delete/expense/:rid', resumeController.deleteExpense);

export default router;