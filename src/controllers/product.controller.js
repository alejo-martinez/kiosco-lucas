import ProductManager from "../dao/service/product.service.js";
import ProductDTO from "../dto/productDTO.js";
import CustomError from "../errors/custom.error.js";
import { calculateSellingPrice } from "../utils.js";

const getAll = async(req, res, next)=>{
    try {
        const products = await ProductManager.getSearch();
        if(!products) throw new CustomError('No data', 'No hay productos disponibles', 4);
        products.sort((a, b) => a.title.localeCompare(b.title));
        return res.status(200).send({status:'success', payload: products});
    } catch (error) {
        next(error);
    }
}

const getProductQuery = async(req, res, next)=>{
    try {
        const {query} = req.query;
        const productos = await ProductManager.getAll(query);
        if(!productos){
            throw new CustomError('No data', 'No hay productos disponibles', 4);
            // const prodsFilter = productos.filter((prod) => prod.title.includes(query));
        }
        return res.status(200).send({status: 'success', payload: productos});
    } catch (error) {
        next(error);
    }
}

const getProductById = async(req, res, next)=>{
    try {
        const {pid} = req.params;
        const producto = await ProductManager.getById(pid);
        if(!producto) throw new CustomError('No data', 'El producto no existe', 4);
        return res.status(200).send({status:'success', payload:producto});
    } catch (error) {
        next(error);
    }
}

const createProduct = async(req, res, next)=>{
    try {
        const {title, stock, costPrice, totalStock, code, percentage, sellingPrice} = req.body;
        console.log(req.body)
        if(!title || !stock || !costPrice || !totalStock || !code || !percentage ) throw new CustomError('Missing fields', 'Debes completar todos los campos', 2);
        const prod = new ProductDTO(title, costPrice, stock, totalStock, code, percentage, sellingPrice);
        await ProductManager.create(prod);
        res.status(200).send({status: 'success', message:'Producto creado!'})
    } catch (error) {
        next(error);
    }
}

const updateAllProduct = async(req, res, next)=>{
    try {
        const {pid} = req.params;
        const {prod} = req.body;
        const missingFields =  Object.values(prod).every((valor) => valor !== null && valor !== undefined && valor !== "");
        if(!prod || !missingFields) throw new CustomError('Missing data', 'No puede haber campos vacíos', 2);
        const newProduct = await ProductManager.updateFull(pid, prod);
        return res.status(200).send({status:'success', payload: newProduct, message: 'Producto actualizado!'});
    } catch (error) {
        next(error);
    }
}

const updateProduct = async(req, res, next)=>{
    try {
        const {pid} = req.params;
        const {field, value} = req.body;
        if(!value) throw new CustomError('Missing data', 'Proporciona un valor para actualizar', 2);
        if(field === 'costPrice'){
            const producto = await ProductManager.getById(pid);
            const newPrice = calculateSellingPrice(producto.percentage, value);
            await ProductManager.update(pid, field, value);
            await ProductManager.update(pid, 'sellingPrice', newPrice);
            res.status(200).send({status:'success', message: 'Producto actualizado!'});
        } else if(field === 'percentage'){
            const producto = await ProductManager.getById(pid);
            const newPrice = calculateSellingPrice(value, producto.costPrice);
            await ProductManager.update(pid, 'sellingPrice', newPrice);
            await ProductManager.update(pid, field, value);
            res.status(200).send({status:'success', message: 'Producto actualizado!'});
        } else{
            await ProductManager.update(pid, field, value);
            res.status(200).send({status:'success', message: 'Producto actualizado!'});
        }
    } catch (error) {
        next(error)
    }
}

const deleteProduct = async(req, res, next)=>{
    try {
        const {pid} = req.params;
        if(!pid) throw new CustomError('No data', 'Missing id', 4);
        await ProductManager.delete(pid);
        return res.status(200).send({status:'success', message: 'Producto eliminado !'});
    } catch (error) {
        next(error);
    }
}

export default {getProductQuery, createProduct, updateProduct, getProductById, updateAllProduct, deleteProduct, getAll};