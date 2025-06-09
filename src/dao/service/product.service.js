import { productModel } from "../models/product.model.js";

export default class ProductManager {

    static async getAll({ page = 1, limit = 12, filter = {}, sort = {}, search = '' }) {
        const query = { ...filter };

        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [
                { title: regex },
                { code: regex }
            ];
        }
        // console.log(sort)
        const result = await productModel.paginate(query, {
            lean: true,
            page,
            limit,
            sort,
            collation: { locale: "es", strength: 1 }
        });

        const { docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages } = result;

        return { docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages, page };
    }

    /**
     * Buscar productos sin filtros ni paginación
     */
    static async getSearch(filter = {}, projection = null, session = null) {
        return await productModel.find(filter, projection).session(session).lean();
    }

    /**
     * Obtener producto por ID
     */
    static async getById(id, projection = null, session = null) {
        return await productModel.findById(id, projection).session(session).lean();
    }

    /**
     * Obtener un producto por clave genérica
     */
    static async getBy(key, value, projection = null, session = null) {
        return await productModel.findOne({ [key]: value }, projection).session(session).lean();
    }

    /**
     * Crear un producto nuevo
     */
    static async create(prod, session = null) {
        return await productModel.create([prod], { session });
    }

    /**
     * Reemplazar un producto completo
     */
    static async updateFull(id, prod, session = null) {
        return await productModel.findOneAndUpdate({ _id: id }, prod, { new: true, session });
    }

    /**
     * Actualizar un solo campo dinámico
     */
    static async update(id, updates = {}, session = null) {
        return await productModel.updateOne({ _id: id }, updates, { session });
    }

    /**
     * Eliminar producto por ID
     */
    static async delete(id, session = null) {
        return await productModel.deleteOne({ _id: id }, { session });
    }

    /**
     * Descontar stock de forma segura (no permite stock negativo)
     */
    static async discountStock(id, quantity, session = null) {
        const result = await productModel.updateOne(
            { _id: id, stock: { $gte: quantity } },
            { $inc: { stock: -quantity } },
            { session }
        );

        if (result.modifiedCount === 0) {
            throw new Error("Stock insuficiente o producto no encontrado");
        }

        return result;
    }

    // static async getAll(page, filter, valueFilter){
    //     let query = {};
    //     let sort;

    //     if (filter && valueFilter !== undefined) {
    //         // Si el filtro es "stock" y queremos filtrar stock <= valueFilter
    //         if (filter === "stock") {
    //             // query[filter] = { $lte: Number(valueFilter) }; 
    //             sort = {stock: Number(valueFilter)}
    //         } else if(filter === 'title'){
    //             sort = {[filter]: Number(valueFilter)}
    //         } else {
    //             query[filter] = valueFilter; 
    //         }
    //     }

    //     // Ejecutar la consulta con paginación
    //     const { docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages } = 
    //         await productModel.paginate(query, { lean: true, limit: 12, page, sort, collation: { locale: "es", strength: 1 } });

    //     return { docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages, page }; 
    // }

    // static async getSearch(){
    //     return await productModel.find().lean();
    // }

    // static async getById(id){
    //     return await productModel.findOne({_id: id}).lean();
    // }

    // static async getBy(key, value){
    //     return await productModel.findOne({[key]:value}).lean()
    // }

    // static async create(prod){
    //     await productModel.create(prod);
    // }

    // static async updateFull(id, prod){
    //     return await productModel.findOneAndUpdate({_id: id}, prod);
    // }

    // static async update(id, key, value){
    //     await productModel.updateOne({_id: id}, {$set: {[key]: value}});
    // }

    // static async delete(id){
    //     await productModel.deleteOne({ _id : id });
    // }
}