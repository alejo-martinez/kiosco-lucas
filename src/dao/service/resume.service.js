import { resumeModel } from "../models/resume.model.js";

export default class ResumeManager {
    static async createResume(resume) {
        return await resumeModel.create(resume);
    }

    static async getSummaries() {
        return await resumeModel.find().lean();
    }

    static async endDayResume(date, id, userId) {
        await resumeModel.updateOne({ _id: id }, { finish_date: { end: date, seller: userId } });
    }

    static async getTodayResume(date) {
        return await resumeModel.findOne({ date: date });
    }

    static async updateResume(filter, update = {}, session = null) {
        const options = session ? { session } : {};
        return await resumeModel.updateOne(filter, update, options);
    }


    static async getMonthResume(month, year) {
        return await resumeModel.findOne({ month: month, year: year }).lean();
    }

    static async getResumeById(id) {
        return await resumeModel.findOne({ _id: id }).populate('init_date.seller').populate('finish_date.seller').populate('tickets.ticket').populate({ path: 'tickets.ticket', populate: { path: 'seller' } }).populate({ path: 'expenses.expense', populate: [{ path: 'product' }, { path: 'user' }] }).lean();
    }

    static async addTicket(rid, tid) {
        return await resumeModel.updateOne({ _id: rid }, { $push: { tickets: { ticket: tid } } });
    }

    static async getAllResumeByCat(cat, page) {
        if (cat === 'diary') {
            const { docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages } = await resumeModel.paginate({ category: cat }, { lean: true, limit: 12, page, sort: { init_date: -1 } });
            return { docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages, page };
        }
        if (cat === 'monthly') {
            const now = new Date();
            const currentMonth = now.getMonth() + 1; // porque en JS enero es 0
            const currentYear = now.getFullYear();
            const list = await resumeModel.aggregate([
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
            // const date = new Date();
            // const actualMonth = date.getMonth() + 1;
            // const actualYear = date.getFullYear();
            // const { docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages } = await resumeModel.paginate({}, {lean: true, limit: 12, page, sort:{month:-1}});

            // return {docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages, page};
        }
    }

    static async addExpense(id, data, session) {
        await resumeModel.updateOne({ _id: id }, { $push: { expenses: data } }, {session});
    }

    static async updateFull(id, resume, session = null) {
        return await resumeModel.findOneAndUpdate({ _id: id }, resume).session(session);
    }

    static async deleteExpense(id, index) {
        const resume = await resumeModel.findOne({ _id: id }).lean();
        resume.utilityExpenses.splice(index, 1);
        await resumeModel.updateOne({ _id: id }, { utilityExpenses: resume.utilityExpenses });
    }


}