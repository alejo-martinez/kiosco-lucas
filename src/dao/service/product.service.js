import { productModel } from "../models/product.model.js";

export default class  ProductManager{

    static async getAll(page, filter, valueFilter){
        let query = {};
        let sort;
        
        if (filter && valueFilter !== undefined) {
            // Si el filtro es "stock" y queremos filtrar stock <= valueFilter
            if (filter === "stock") {
                // query[filter] = { $lte: Number(valueFilter) }; 
                sort = {stock: Number(valueFilter)}
            } else if(filter === 'title'){
                sort = {[filter]: Number(valueFilter)}
            } else {
                query[filter] = valueFilter; 
            }
        }
        console.log(sort)
        // Ejecutar la consulta con paginación
        const { docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages } = 
            await productModel.paginate(query, { lean: true, limit: 12, page, sort, collation: { locale: "es", strength: 1 } });
    
        return { docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages, page }; 
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

    static async updateFull(id, prod){
        return await productModel.findOneAndUpdate({_id: id}, prod);
    }

    static async update(id, key, value){
        await productModel.updateOne({_id: id}, {$set: {[key]: value}});
    }

    static async delete(id){
        await productModel.deleteOne({ _id : id });
    }
}