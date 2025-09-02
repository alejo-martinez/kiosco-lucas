import ProductManager from "../dao/service/product.service.js";
import ProductDTO from "../dto/productDTO.js";
import CustomError from "../errors/custom.error.js";
import { calculateSellingPrice } from "../utils.js";

const getAll = async (req, res, next) => {
    try {
        const prodManager = new ProductManager(req.db);
        const products = await prodManager.getSearch();
        if (!products) throw new CustomError('No data', 'No hay productos disponibles', 4);
        products.sort((a, b) => a.title.localeCompare(b.title));
        return res.status(200).send({ status: 'success', payload: products });
    } catch (error) {
        next(error);
    }
}

const getProductQuery = async (req, res, next) => {
    try {
        const { query, filter, valueFilter } = req.query;
        const prodManager = new ProductManager(req.db);
        let productos;
        if (filter && valueFilter) {
            productos = await prodManager.getAll({ sort: { [filter]: Number(valueFilter) }, page: query });
        } else {
            productos = await prodManager.getAll({ page: query });
        }
        // console.log(productos)
        if (!productos) {
            throw new CustomError('No data', 'No hay productos disponibles', 4);
            // const prodsFilter = productos.filter((prod) => prod.title.includes(query));
        }
        return res.status(200).send({ status: 'success', payload: productos });
    } catch (error) {
        next(error);
    }
}

const getProductById = async (req, res, next) => {
    try {
        const { pid } = req.params;
        const prodManager = new ProductManager(req.db);
        const producto = await prodManager.getById(pid);
        if (!producto) throw new CustomError('No data', 'El producto no existe', 4);
        return res.status(200).send({ status: 'success', payload: producto });
    } catch (error) {
        next(error);
    }
}

const createProduct = async (req, res, next) => {
    try {
        const { title, stock, costPrice, totalStock, code, percentage, sellingPrice } = req.body;
        if (!title || !stock || !costPrice || !totalStock || !code || !percentage) throw new CustomError('Missing fields', 'Debes completar todos los campos', 2);
        const prodManager = new ProductManager(req.db);
        const prod = new ProductDTO(title, costPrice, stock, totalStock, code, percentage, sellingPrice);
        await prodManager.create(prod);
        res.status(200).send({ status: 'success', message: 'Producto creado!' })
    } catch (error) {
        next(error);
    }
}

const updateAllProduct = async (req, res, next) => {
    try {
        const { pid } = req.params;
        const { prod } = req.body;
        const missingFields = Object.values(prod).every((valor) => valor !== null && valor !== undefined && valor !== "");
        if (!prod || !missingFields) throw new CustomError('Missing data', 'No puede haber campos vacíos', 2);
        const prodManager = new ProductManager(req.db);
        const newProduct = await prodManager.updateFull(pid, prod);
        return res.status(200).send({ status: 'success', payload: newProduct, message: 'Producto actualizado!' });
    } catch (error) {
        next(error);
    }
}

const updateProduct = async (req, res, next) => {
    try {
        const { pid } = req.params;
        const { field, value } = req.body;
        if (!value) throw new CustomError('Missing data', 'Proporciona un valor para actualizar', 2);
        const prodManager = new ProductManager(req.db);
        if (field === 'costPrice') {
            const producto = await prodManager.getById(pid);
            const newPrice = calculateSellingPrice(producto.percentage, value);
            await prodManager.update(pid, field, value);
            await prodManager.update(pid, 'sellingPrice', newPrice);
            return res.status(200).send({ status: 'success', message: 'Producto actualizado!' });
        } else if (field === 'percentage') {
            const producto = await prodManager.getById(pid);
            const newPrice = calculateSellingPrice(value, producto.costPrice);
            await prodManager.update(pid, 'sellingPrice', newPrice);
            await prodManager.update(pid, field, value);
            return res.status(200).send({ status: 'success', message: 'Producto actualizado!' });
        } else if (field === 'stock') {
            const producto = await prodManager.getById(pid);
            producto.totalStock = Number(producto.totalStock) + Number(value);
            producto.stock = Number(producto.stock) + Number(value);
            const newProd = await prodManager.updateFull(pid, producto);

            return res.status(200).send({ status: 'success', payload: newProd, message: 'Stock actualizado!' })
        }
        else {
            await prodManager.update(pid, field, value);
            return res.status(200).send({ status: 'success', message: 'Producto actualizado!' });
        }
    } catch (error) {
        next(error)
    }
}

const getLowStockProducts = async (req, res, next) => {
    try {
        const prodManager = new ProductManager(req.db);
        const products = await prodManager.getSearch();
        const lowStock = products.filter(prods => {
            if (prods.stock <= 2) return prods._id;
        });
        return res.status(200).send({ status: 'success', payload: lowStock });
    } catch (error) {
        next(error);
    }
}

const deleteProduct = async (req, res, next) => {
    try {
        const { pid } = req.params;
        if (!pid) throw new CustomError('No data', 'Missing id', 4);
        const prodManager = new ProductManager(req.db);
        await prodManager.delete(pid);
        return res.status(200).send({ status: 'success', message: 'Producto eliminado !' });
    } catch (error) {
        next(error);
    }
}

export default { getProductQuery, createProduct, updateProduct, getProductById, updateAllProduct, deleteProduct, getAll, getLowStockProducts };