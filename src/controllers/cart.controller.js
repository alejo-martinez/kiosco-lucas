import CartManager from "../dao/service/cart.service.js";
import CustomError from "../errors/custom.error.js";

const createCart = async(req, res, next)=>{
    try {
        const cart = await CartManager.createCart();
        return res.status(200).send({status:'success', message: 'Creado!', payload: cart});
    } catch (error) {
        next(error);
    }
}

const emptyCart = async(req, res, next)=>{
    try {
        const {cid} = req.params;
        const cart = await CartManager.getCartById(cid);
        if(cart.products.length === 0) throw new CustomError('Conflict', 'El  carrito ya está vacío', 6);
        await CartManager.emptyCart(cid);
        return res.status(200).send({status:'success', message: 'Carrito vaciado!'});
    } catch (error) {
        next(error);
    }
}

export default {createCart, emptyCart};