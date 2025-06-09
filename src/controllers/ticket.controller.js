import CartManager from "../dao/service/cart.service.js";
import ProductManager from "../dao/service/product.service.js";
import { TicketManager } from "../dao/service/ticket.service.js";
import UserManager from "../dao/service/user.service.js";
import { TicketDTO } from "../dto/ticketDTO.js";
import CustomError from "../errors/custom.error.js";
import { io } from '../app.js';
import ResumeManager from "../dao/service/resume.service.js";
import mongoose from "mongoose";
import { productModel } from "../dao/models/product.model.js";
import { ticketModel } from "../dao/models/ticket.model.js";
import { cartModel } from "../dao/models/cart.model.js";
import { resumeModel } from "../dao/models/resume.model.js";

const getAllTickets = async (req, res, next) => {
    try {
        const { usuario, page } = req.query;
        // console.log(req.query)
        const tickets = await TicketManager.getAll(page, usuario);
        return res.status(200).send({ status: 'success', payload: tickets });
    } catch (error) {
        next(error);
    }
}

const getTicketById = async (req, res, next) => {
    try {
        const { tid } = req.params;
        const ticket = await TicketManager.getById(tid);

        if (!ticket) throw new CustomError('No data', 'No se encontró una venta para el id especificado', 4);
        return res.status(200).send({ status: 'success', payload: ticket });
    } catch (error) {
        next(error);
    }
}

const getTicketRange = async (req, res, next) => {
    try {

    } catch (error) {
        next(error);
    }
}

const createTicket = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user;

        const user = await UserManager.getById(userId)
        const { amount, payment_method, rid } = req.body;
        if (!rid) throw new CustomError('Missing arguments', 'Debes iniciar el día primero', 2);
        const activeResume = await ResumeManager.getResumeById(rid);
        if (!payment_method) throw new CustomError('Missing arguments', 'Selecciona un método de pago', 2);
        if (amount <= 0) throw new CustomError('Invalid amount', 'El total no puede ser 0 o menor que 0', 1);
        if (!user) throw new CustomError('Sesion expired', 'Sesión expirada, volvé a iniciar sesión', 6);
        const cart = await CartManager.getCartById(user.cart._id);
        if (cart.products.length === 0) throw new CustomError('No products', 'Debes agregar al menos un producto', 2)



        const productsCart = [];
        const productIds = cart.products.map(p => p.product._id); // Armamos lista de IDs de productos

        // 📦 Traemos los productos desde la DB (usamos $in y lean para eficiencia)
        const dbProducts = await ProductManager.getSearch({ _id: { $in: productIds } }, null, session);
        // const dbProducts = await productModel.find({ _id: { $in: productIds } })
        //     .session(session)
        //     .lean();

        // 🔍 Recorremos el carrito para validar stock y preparar el array del ticket
        for (const item of cart.products) {
            const prod = item.product;
            const dbProduct = dbProducts.find(p => p._id.toString() === prod._id.toString());

            if (!dbProduct) throw new CustomError('Not found', `Producto ${prod.title} no encontrado`, 4);

            const remainingStock = dbProduct.stock - item.quantity;
            if (remainingStock < 0) {
                throw new CustomError('Stock error', `Stock insuficiente para ${prod.title}`, 5);
            }

            // 🧾 Armamos la lista de productos para el ticket
            productsCart.push({
                product: {
                    title: prod.title,
                    sellingPrice: prod.sellingPrice,
                    id: prod._id,
                    code: prod.code,
                    costPrice: prod.costPrice,
                },
                quantity: item.quantity,
                totalPrice: item.totalPrice,
            });

            // 📢 Emitimos alerta si el stock es bajo
            if (remainingStock <= 2) {
                io.emit('lowstock', { prod: prod._id });
            }

            // ⚙️ Actualizamos el stock de forma atómica
            await ProductManager.update(prod._id, { $inc: { stock: -item.quantity } }, session)
            // await productModel.findByIdAndUpdate(
            //     prod._id,
            //     { $inc: { stock: -item.quantity } },
            //     { session }
            // );
        }

        // 🎫 Creamos el ticket en la base de datos
        const ticket = new TicketDTO(productsCart, amount, user._id, payment_method);
        const newTicket = await TicketManager.createTicket(ticket, session);
        console.log(`newTicket:`)
        console.log(newTicket)
        // 📈 Actualizamos el resumen (cantidad de ventas y monto total)

        // ✅ Actualizar resumen con ventas, monto, tickets
        activeResume.sales += 1;
        activeResume.amount += amount;
        activeResume.tickets.push({ ticket: newTicket._id });
        // const updates = {
        //     $inc: { sales: 1, amount: amount },
        //     $push: { tickets: { ticket: ticket._id } }
        // };

        // await ResumeManager.updateResume({_id: rid}, updates, session);

        // await resumeModel.findByIdAndUpdate(rid, updates, { session });
        // 🧮 Actualizamos los productos del resumen (ventas del día)
        for (const item of cart.products) {
            const prod = item.product;

            const existingIndex = activeResume.products.findIndex(
                p => p.product.id === prod._id.toString()
            );

            if (existingIndex !== -1) {
                // Ya existe, sumamos cantidades y total
                activeResume.products[existingIndex].quantity += item.quantity;
                activeResume.products[existingIndex].total += item.totalPrice;
            } else {
                // Nuevo producto, lo agregamos
                activeResume.products.push({
                    product: {
                        title: prod.title,
                        sellingPrice: prod.sellingPrice,
                        id: prod._id,
                        costPrice: prod.costPrice,
                        code: prod.code
                    },
                    quantity: item.quantity,
                    total: item.totalPrice
                });
            }
        }

        // 💳 Actualizamos el método de pago utilizado
        const methodIndex = activeResume.amount_per_method.findIndex(m => m.method === payment_method);
        if (methodIndex !== -1) {
            activeResume.amount_per_method[methodIndex].amount += amount;
        } else {
            activeResume.amount_per_method.push({ method: payment_method, amount });
        }

        // 💾 Guardamos el resumen con todos los cambios
        await ResumeManager.updateFull(activeResume._id, activeResume, session)
        // await activeResume.save({ session });

        // 🧹 Vaciamos el carrito del usuario
        const updatedCart = await CartManager.update(user.cart._id, { $set: { products: [] } }, session);
        // await cartModel.findByIdAndUpdate(
        //     user.cart._id,
        //     { $set: { products: [] } },
        //     { session }
        // );

        // ✅ Confirmamos la transacción (todo se guarda)
        await session.commitTransaction();
        session.endSession();

        console.log(updatedCart)
        // 📦 Respondemos con éxito y el ID del ticket creado
        return res.status(200).send({
            status: 'success',
            message: 'Pago realizado!',
            payload: updatedCart
        });

        // for (let index = 0; index < cart.products.length; index++) {
        //     const prod = cart.products[index];

        //     productsCart.push({ product: { title: prod.product.title, sellingPrice: prod.product.sellingPrice, id: prod.product._id, code: prod.product.code, costPrice: prod.product.costPrice }, quantity: prod.quantity, totalPrice: prod.totalPrice });

        //     const existProdIndex = activeResume.products.findIndex(p => p.product.id === prod.product._id.toString());



        //     if (existProdIndex !== -1) {

        //         activeResume.products[existProdIndex].quantity += Number(prod.quantity);
        //         activeResume.products[existProdIndex].total += Number(prod.totalPrice);
        //     } else {

        //         activeResume.products.push({ product: { title: prod.product.title, sellingPrice: prod.product.sellingPrice, id: prod.product._id, costPrice: prod.product.costPrice, code: prod.product.code }, quantity: prod.quantity, total: prod.totalPrice })
        //     }

        // }

        // // const existMethod = activeResume.amount_per_method.findIndex(m => m.method === payment_method);
        // // if (existMethod !== -1) {
        // //     activeResume.amount_per_method[existMethod].amount += amount;
        // // } else {
        // //     activeResume.amount_per_method.push({ method: payment_method, amount: amount });
        // // }

        // products: {type: [{product: {title: String, sellingPrice: Number, id: String, costPrice: Number, code: Number}, quantity: Number, total: Number}], default: []},

        // // const ticket = new TicketDTO(productsCart, amount, user._id, payment_method);
        // // const newTicket = await TicketManager.createTicket(ticket);

        // const totalSales = activeResume.sales;
        // const partialTotal = activeResume.amount;
        // const newTotal = Number(partialTotal) + Number(amount);

        // // activeResume.sales = activeResume.sales + 1;
        // // activeResume.amount = activeResume.amount + Number(amount);
        // // activeResume.tickets.push({ ticket: newTicket._id });
        // const newTotalSales = Number(totalSales) + 1;

        // // await ResumeManager.updateFull(activeResume._id, activeResume);
        // await ResumeManager.addTicket(rid, newTicket._id)
        // await ResumeManager.updateResume(rid, 'sales', newTotalSales);
        // await ResumeManager.updateResume(rid, 'amount', newTotal);
        // // const productos = await ProductManager.getSearch();
        // // for (let index = 0; index < cart.products.length; index++) {
        // //     const finded = productos.find(p => p._id.equals(cart.products[index].product._id));
        // //     if (finded) {
        // //         const newQuantity = finded.stock - cart.products[index].quantity;
        // //         if (newQuantity <= 2) {
        // //             io.emit('lowstock', { prod: finded._id });
        // //         }
        // //         await ProductManager.update(finded._id, 'stock', newQuantity);
        // //     }
        // // }
        // // const updated = await CartManager.emptyCart(user.cart._id);

        // // return res.status(200).send({ status: 'success', message: 'Pago realizado!', payload: updated });
        // // await session.commitTransaction();
        // // session.endSession();
        // // return res.status(200).send({ status: 'success', message: 'Pago realizado!' });
    } catch (error) {
        console.log(error)
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
}

export default { getAllTickets, createTicket, getTicketById };