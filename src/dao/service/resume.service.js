import { resumeModel } from "../models/resume.model.js";

export default class ResumeManager{
    static async createResume(resume){
        return await resumeModel.create(resume);
    }

    static async getSummaries(){
        return await resumeModel.find().lean();
    }

    static async endDayResume(amount, products, date, id, sales, methods, userId){
        await resumeModel.updateOne({_id: id}, {amount: amount, products: products, finish_date: {end: date, seller: userId}, sales: sales, amount_per_method: methods});
    }

    static async getTodayResume(date){
        return await resumeModel.findOne({date: date});
    }

    static async updateResume(rid, field, value){
        await resumeModel.updateOne({_id: rid}, {$set:{[field]:value}});
    }

    static async getMonthResume(month, year){
        return await resumeModel.findOne({month: month, year: year}).lean();
    }

    static async getResumeById(id){
        return await resumeModel.findOne({_id: id}).populate('init_date.seller').populate('finish_date.seller').populate('tickets.ticket').populate({ path: 'tickets.ticket', populate: { path: 'seller' }}).lean();
    }

    static async addTicket(rid, tid){
        return await resumeModel.updateOne({_id: rid}, {$push:{tickets:{ticket:tid}}});
    }

    static async getAllResumeByCat(cat, page){
        if(cat === 'diary'){
            const { docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages } = await resumeModel.paginate({category: cat}, {lean: true, limit: 12, page, sort:{init_date: -1}});
            return {docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages, page};
        }
        if(cat === 'monthly'){
            const date = new Date();
            const { docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages } = await resumeModel.paginate({category: cat, year: date.getFullYear()}, {lean: true, limit: 12, page, sort:{month:-1}});
            return {docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages, page};
        }
    }

    static async addExpense(id, data){
        await resumeModel.updateOne({_id : id }, {$push:{utilityExpenses: data}});
    }

    static async deleteExpense(id, index){
        const resume = await resumeModel.findOne({_id: id}).lean();
        resume.utilityExpenses.splice(index, 1);
        await resumeModel.updateOne({_id: id}, {utilityExpenses: resume.utilityExpenses});
    }
}