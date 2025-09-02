
import { getExpenseModel, getProductModel, getResumeModel, getTicketModel, getUserModel } from "../models/factory.js";

export default class ResumeManager {
    constructor(connection) {
        this.Resume = getResumeModel(connection)
        this.Ticket = getTicketModel(connection);
        this.User = getUserModel(connection);
        this.Expense = getExpenseModel(connection);
        this.Product = getProductModel(connection);
    }

    async createResume(resume) {
        return await this.Resume.create(resume);
    }

    async getSummaries() {
        return await this.Resume.find().lean();
    }

    async endDayResume(date, id, userId) {
        await this.Resume.updateOne({ _id: id }, { finish_date: { end: date, seller: userId } });
    }

    async getTodayResume(date) {
        return await this.Resume.findOne({ date: date });
    }

    async updateResume(filter, update = {}, session = null) {
        const options = session ? { session } : {};
        return await this.Resume.updateOne(filter, update, options);
    }


    async getMonthResume(month, year) {
        return await this.Resume.findOne({ month: month, year: year }).lean();
    }

    async getResumeById(id) {
        return await this.Resume.findOne({ _id: id }).populate({ path: 'init_date.seller', model: this.User }).populate({ path: 'finish_date.seller', model: this.User }).populate({ path: 'tickets.ticket', model: this.Ticket }).populate({ path: 'tickets.ticket', populate: { path: 'seller', model: this.User }, model: this.Ticket }).populate({ path: 'expenses.expense', modeL: this.Expense, populate: [{ path: 'product', model: this.Product }, { path: 'user', model: this.User }] }).lean();
    }

    async addTicket(rid, tid) {
        return await this.Resume.updateOne({ _id: rid }, { $push: { tickets: { ticket: tid } } });
    }

    async getAllResumeByCat(cat, page) {
        if (cat === 'diary') {
            const { docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages } = await this.Resume.paginate({ category: cat }, { lean: true, limit: 12, page, sort: { init_date: -1 } });
            return { docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages, page };
        }
        if (cat === 'monthly') {
            const now = new Date();
            const currentMonth = now.getMonth() + 1; // porque en JS enero es 0
            const currentYear = now.getFullYear();
            const list = await this.Resume.aggregate([
                {
                    $group: {
                        _id: { month: '$month', year: '$year' },
                        daysCount: { $sum: 1 },
                        totalAmount: { $sum: '$amount' },
                        totalSales: { $sum: '$sales' },
                        totalProfit: { $sum: { $subtract: ['$amount', '$initAmount'] } }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        month: '$_id.month',
                        year: '$_id.year',
                        daysCount: 1,
                        totalAmount: 1,
                        totalSales: 1,
                        totalProfit: 1,
                        isActive: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$_id.month', currentMonth] },
                                        { $eq: ['$_id.year', currentYear] }
                                    ]
                                },
                                true,
                                false
                            ]
                        }
                    }
                },
                { $sort: { year: -1, month: -1 } }
            ]);

            return list;
        }
    }

    async addExpense(id, data, session) {
        await this.Resume.updateOne({ _id: id }, { $push: { expenses: data } }, { session });
    }

    async updateFull(id, resume, session = null) {
        return await this.Resume.findOneAndUpdate({ _id: id }, resume).session(session);
    }

    async deleteExpense(id, index) {
        const resume = await this.Resume.findOne({ _id: id }).lean();
        resume.utilityExpenses.splice(index, 1);
        await this.Resume.updateOne({ _id: id }, { utilityExpenses: resume.utilityExpenses });
    }


}