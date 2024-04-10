import { productModel } from "../models/product.model.js";

export default class  ProductManager{
    static async getAll(page){
        const {docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages} = await productModel.paginate({}, {lean: true, limit: 12, page});
        return {docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages, page};    
    }

    static async getSearch(){
        return await productModel.find().lean();
    }

    static async getById(id){
        return await productModel.findOne({_id: id}).lean();
    }

    static async getBy(key, value){
        return await productModel.findOne({[key]:value}).lean()
    }

    static async create(prod){
        await productModel.create(prod);
    }

    static async update(id, key, value){
        await productModel.updateOne({_id: id}, {$set: {[key]: value}});
    }

    static async delete(id){
        await productModel.deleteOne({ _id : id });
    }
}