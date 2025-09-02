import { Router } from "express";
import expenseController from "../controllers/expense.controller.js";
import { authToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/create', authToken, expenseController.createExpense);

export default router;