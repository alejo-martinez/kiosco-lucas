import CartManager from "../dao/service/cart.service.js";
import CustomError from "../errors/custom.error.js";

const createCart = async (req, res, next) => {
    try {
        const cartManager = new CartManager(req.db);
        const cart = await cartManager.createCart();
        return res.status(200).send({ status: 'success', message: 'Creado!', payload: cart });
    } catch (error) {
        next(error);
    }
}

const getCart = async (req, res, next) => {
    try {
        const { cid } = req.params;
        const cartManager = new CartManager(req.db);
        const cart = await cartManager.getCartById(cid);
        return res.status(200).send({ status: 'success', payload: cart });
    } catch (error) {
        next(error);
    }
}

const removeProductById = async (req, res, next) => {
    try {
        const { cid } = req.params;
        const { pid } = req.body;
        const cartManager = new CartManager(req.db);
        const updatedCart = await cartManager.removeProduct(cid, pid);
        return res.status(200).send({ status: 'success', payload: updatedCart });
    } catch (error) {
        next(error);
    }
}

const emptyCart = async (req, res, next) => {
    try {
        const { cid } = req.params;
        const cartManager = new CartManager(req.db);
        const cart = await cartManager.getCartById(cid);
        if (cart.products.length === 0) throw new CustomError('Conflict', 'El  carrito ya está vacío', 6);
        const newCart = await cartManager.emptyCart(cid);
        return res.status(200).send({ status: 'success', message: 'Carrito vaciado!', payload: newCart });
    } catch (error) {
        next(error);
    }
}

export default { createCart, emptyCart, getCart, removeProductById };