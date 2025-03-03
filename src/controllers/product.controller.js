import ProductManager from "../dao/service/product.service.js";
import ProductDTO from "../dto/productDTO.js";
import CustomError from "../errors/custom.error.js";
import { calculateSellingPrice } from "../utils.js";

const getProductQuery = async(req, res, next)=>{
    try {
        const {query} = req.query;
        const productos = await ProductManager.getAll();
        if(productos){
            const prodsFilter = productos.filter((prod) => prod.title.includes(query));
            res.status(200).send({status: 'success', payload: prodsFilter});
        }
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

export default {getProductQuery, createProduct, updateProduct};