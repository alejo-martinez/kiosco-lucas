import CartManager from "../dao/service/cart.service.js";
import ProductManager from "../dao/service/product.service.js";
import { TicketManager } from "../dao/service/ticket.service.js";
import UserManager from "../dao/service/user.service.js";
import { TicketDTO } from "../dto/ticketDTO.js";
import CustomError from "../errors/custom.error.js";
import {io} from '../app.js';
import ResumeManager from "../dao/service/resume.service.js";

const getAllTickets = async(req, res, next)=>{
    try {
        const {usuario, page=1} = req.query;
        const tickets = await TicketManager.getAll(page, usuario);
        return res.status(200).send({status: 'success', payload:tickets});
    } catch (error) {
        next(error);
    }
}

const getTicketById = async(req, res, next)=>{
    try {
        const {tid} = req.params;
        const ticket = await TicketManager.getById(tid);

        if(!ticket) throw new CustomError('No data', 'No se encontró una venta para el id especificado', 4);
        return res.status(200).send({status:'success', payload:ticket});
    } catch (error) {
        next(error);
    }
}

const getTicketRange = async(req, res, next)=>{
    try {
        
    } catch (error) {
        next(error);
    }
}

const createTicket = async(req, res, next)=>{
    try {
        const userId = req.user;

        const user = await UserManager.getById(userId)
        const {amount, payment_method, rid} = req.body;
        if(!rid) throw new CustomError('Missing arguments', 'Debes iniciar el día primero', 2);
        const activeResume = await ResumeManager.getResumeById(rid);
        if(!payment_method) throw new CustomError('Missing arguments', 'Selecciona un método de pago', 2);
        if(amount <= 0) throw new CustomError('Invalid amount', 'El total no puede ser 0 o menor que 0', 1);
        if(!user) throw new CustomError('Sesion expired', 'Sesión expirada, volvé a iniciar sesión', 6);
        const cart = await CartManager.getCartById(user.cart._id);
        if(cart.products.length === 0) throw new CustomError('No products', 'Debes agregar al menos un producto', 2)
        const productsCart = [];
        cart.products.forEach(prod=>{
            productsCart.push({product: {title: prod.product.title, sellingPrice: prod.product.sellingPrice, id: prod.product._id, code: prod.product.code, costPrice: prod.product.costPrice }, quantity: prod.quantity, totalPrice: prod.totalPrice });
        })
        const ticket = new TicketDTO(productsCart, amount, user._id, payment_method);
        const newTicket = await TicketManager.createTicket(ticket);
        // const activeResume = await ResumeManager.getResumeById(rid);
        const totalSales = activeResume.sales;
        const partialTotal = activeResume.amount;
        const newTotal = Number(partialTotal) + Number(amount);
        const newTotalSales = Number(totalSales) + 1;
        await ResumeManager.addTicket(rid, newTicket._id)
        await ResumeManager.updateResume(rid, 'sales', newTotalSales);
        await ResumeManager.updateResume(rid, 'amount', newTotal);
        const productos = await ProductManager.getSearch();
        for (let index = 0; index < cart.products.length; index++) {
            const finded = productos.find(p => p._id.equals(cart.products[index].product._id));
            if(finded){
                const newQuantity = finded.stock - cart.products[index].quantity;
                if(newQuantity <= 2){
                    io.emit('lowstock', {prod:finded._id});
                }
                await ProductManager.update(finded._id, 'stock', newQuantity);
            }
        }
        const updated = await CartManager.emptyCart(user.cart._id);
        
        return res.status(200).send({status:'success', message: 'Pago realizado!', payload: updated});
    } catch (error) {
        next(error);
    }
}

export default {getAllTickets, createTicket, getTicketById};