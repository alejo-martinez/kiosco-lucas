import { Router } from "express";
import ticketController from "../controllers/ticket.controller.js";
import { adminUser, authToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get('/', authToken, adminUser, ticketController.getAllTickets);
router.get('/:tid', ticketController.getTicketById);
router.post('/create', authToken, ticketController.createTicket);

export default router;