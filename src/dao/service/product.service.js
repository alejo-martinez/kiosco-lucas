import { productModel } from "../models/product.model.js";

export default class  ProductManager{
    static async getAll(){
        return await productModel.find().lean();    
    }

    static async getById(id){
        return await productModel.findById(id).lean();
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