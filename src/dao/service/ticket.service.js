
import { getTicketModel, getUserModel } from "../models/factory.js";



export class TicketManager {
    constructor(connection) {
        this.Ticket = getTicketModel(connection);
        this.User = getUserModel(connection);

    }
    async getAll(page, usuarioId) {
        const numericPage = Number(page);
        const { docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages } = await this.Ticket.paginate({ seller: usuarioId }, { lean: true, page: numericPage | 1, limit: 25, sort: { created_at: -1 } });
        return { docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages, page };
    }

    async getById(id) {
        return await this.Ticket.findById(id).populate('seller').lean();
    }

    async getMonthOrders(date) {
        const actualMonth = date.getMonth();
        const actualYear = date.getFullYear();
        const initDate = new Date(actualYear, actualMonth, 1);
        const endDate = new Date(actualYear, actualMonth + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        return await this.Ticket.find({ created_at: { $gte: initDate, $lte: endDate } }).lean();
    }

    async createTicket(ticket, session = null) {
        const [createdTicket] = await this.Ticket.create([ticket], { session });
        return createdTicket;
    }

    async getOrdersDate(initDate, finishDate) {

        return await this.Ticket.find({ created_at: { $gte: initDate, $lt: finishDate } }).lean();
    }
}