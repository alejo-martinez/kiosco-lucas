import { cartModel } from "../models/cart.model.js";
import { ticketModel } from "../models/ticket.model.js";
import mongoose from "mongoose";

export class TicketManager {
    static async getAll(page, usuarioId) {
        
        const { docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages } = await ticketModel.paginate({seller: usuarioId}, { lean: true, page: page, limit: 25, sort: { created_at: -1 } });
        return { docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages };
    }

    static async getById(id) {
        return await ticketModel.findById(id).populate('seller').lean();
    }

    static async getMonthOrders(date) {
        const actualMonth = date.getMonth();
        const actualYear = date.getFullYear();
        const initDate = new Date(actualYear, actualMonth, 1);
        const endDate = new Date(actualYear, actualMonth + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        return await ticketModel.find({ created_at: { $gte: initDate, $lte: endDate } }).lean();
    }

    static async createTicket(ticket) {
        return await ticketModel.create(ticket);
    }

    static async getOrdersDate(initDate, finishDate) {

        return await ticketModel.find({ created_at: { $gte: initDate, $lt: finishDate } }).lean();
    }
}