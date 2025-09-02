
import { getProductModel } from "../models/factory.js";

export default class ProductManager {
    constructor(connection) {
        this.Product = getProductModel(connection);
    }
    async getAll({ page = 1, limit = 12, filter = {}, sort = {}, search = '' }) {
        const query = { ...filter };

        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [
                { title: regex },
                { code: regex }
            ];
        }
        // console.log(sort)
        const result = await this.Product.paginate(query, {
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
    async getSearch(filter = {}, projection = null, session = null) {
        return await this.Product.find(filter, projection).session(session).lean();
    }

    /**
     * Obtener producto por ID
     */
    async getById(id, projection = null, session = null) {
        return await this.Product.findById(id, projection).session(session).lean();
    }

    /**
     * Obtener un producto por clave genérica
     */
    async getBy(key, value, projection = null, session = null) {
        return await this.Product.findOne({ [key]: value }, projection).session(session).lean();
    }

    /**
     * Crear un producto nuevo
     */
    async create(prod, session = null) {
        return await this.Product.create([prod], { session });
    }

    /**
     * Reemplazar un producto completo
     */
    async updateFull(id, prod, session = null) {
        return await this.Product.findOneAndUpdate({ _id: id }, prod, { new: true, session });
    }

    /**
     * Actualizar un solo campo dinámico
     */
    async update(id, updates = {}, session = null) {
        return await this.Product.updateOne({ _id: id }, updates, { session });
    }

    /**
     * Eliminar producto por ID
     */
    async delete(id, session = null) {
        return await this.Product.deleteOne({ _id: id }, { session });
    }

    /**
     * Descontar stock de forma segura (no permite stock negativo)
     */
    async discountStock(id, quantity, session = null) {
        const result = await this.Product.updateOne(
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