import ProductManager from "../dao/service/product.service.js";
import ProductDTO from "../dto/productDTO.js";
import CustomError from "../errors/custom.error.js";

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
        const {title, stock, price, totalStock, code, percentage} = req.body;
        if(!title || !stock || !price || !totalStock || !code || !percentage ) throw new CustomError('Missing fields', 'Debes completar todos los campos', 2);
        const prod = new ProductDTO(title, price, stock, totalStock, code, percentage);
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
        await ProductManager.update(pid, field, value);
        res.status(200).send({status:'success', message: 'Producto actualizado!'});
    } catch (error) {
        next(error)
    }
}

export default {getProductQuery, createProduct, updateProduct};