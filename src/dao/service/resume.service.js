import { resumeModel } from "../models/resume.model.js";

export default class ResumeManager{
    static async createResume(resume){
        await resumeModel.create(resume);
    }

    static async endDayResume(amount, orders, date){
        await resumeModel.updateOne({date: date}, {amount: amount, orders: orders});
    }

    static async getTodayResume(date){
        return await resumeModel.findOne({date: date}).populate('orders.order');
    }

    static async getMonthResume(month, year){
        return await resumeModel.findOne({month: month, year: year}).lean();
    }

    static async getResumeById(id){
        return await resumeModel.findById(id).populate({path: 'orders.order', populate: {path: 'products.product'}}).lean();
    }

    static async getAllResumeByCat(cat, page){
        if(cat === 'dairy'){
            const data = await resumeModel.find({category: cat})
            console.log(data)
            const { docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages } = await resumeModel.paginate({category: cat}, {lean: true, limit: 12, page});
            // console.log(docs)
            return {docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages, page};
        }
        if(cat === 'monthly'){
            const date = new Date();
            const { docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages } = await resumeModel.paginate({category: cat, year: date.getFullYear()}, {lean: true, limit: 12, page});
            return {docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages, page};
        }
    }
}