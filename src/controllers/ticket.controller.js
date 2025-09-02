import CartManager from "../dao/service/cart.service.js";
import ProductManager from "../dao/service/product.service.js";
import { TicketManager } from "../dao/service/ticket.service.js";
import UserManager from "../dao/service/user.service.js";
import { TicketDTO } from "../dto/ticketDTO.js";
import CustomError from "../errors/custom.error.js";
import { io } from '../app.js';
import ResumeManager from "../dao/service/resume.service.js";
import mongoose from "mongoose";

const getAllTickets = async (req, res, next) => {
    try {
        const { usuario, page } = req.query;
        // console.log(req.query)
        const ticketManager = new TicketManager(req.db);
        const tickets = await ticketManager.getAll(page, usuario);
        return res.status(200).send({ status: 'success', payload: tickets });
    } catch (error) {
        next(error);
    }
}

const getTicketById = async (req, res, next) => {
    try {
        const { tid } = req.params;
        const ticketManager = new TicketManager(req.db);
        const ticket = await ticketManager.getById(tid);

        if (!ticket) throw new CustomError('No data', 'No se encontró una venta para el id especificado', 4);
        return res.status(200).send({ status: 'success', payload: ticket });
    } catch (error) {
        next(error);
    }
}

const createTicket = async (req, res, next) => {
    try {
        const ticketManager = new TicketManager(req.db);
        const newTicket = await ticketManager.createTicket(req.user.userId, req.body, req.db);
        return res.status(200).send({
            status: 'success',
            message: 'Pago realizado!',
            payload: newTicket
        });

    } catch (error) {
        console.error("Error creando ticket:", error);
        next(error);
    }
};


export default { getAllTickets, createTicket, getTicketById };