import CartManager from "../dao/service/cart.service.js";
import ProductManager from "../dao/service/product.service.js";
import { TicketManager } from "../dao/service/ticket.service.js";
import UserManager from "../dao/service/user.service.js";
import { TicketDTO } from "../dto/ticketDTO.js";
import CustomError from "../errors/custom.error.js";
import { io } from '../app.js';
import ResumeManager from "../dao/service/resume.service.js";
import mongoose from "mongoose";

const getAllTickets = async (req, res, next) => {
    try {
        const { usuario, page } = req.query;
        // console.log(req.query)
        const ticketManager = new TicketManager(req.db);
        const tickets = await ticketManager.getAll(page, usuario);
        return res.status(200).send({ status: 'success', payload: tickets });
    } catch (error) {
        next(error);
    }
}

const getTicketById = async (req, res, next) => {
    try {
        const { tid } = req.params;
        const ticketManager = new TicketManager(req.db);
        const ticket = await ticketManager.getById(tid);

        if (!ticket) throw new CustomError('No data', 'No se encontró una venta para el id especificado', 4);
        return res.status(200).send({ status: 'success', payload: ticket });
    } catch (error) {
        next(error);
    }
}

const createTicket = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user;
        const userManager = new UserManager(req.db);
        const resumeManager = new ResumeManager(req.db);
        const productManager = new ProductManager(req.db);
        const cartManager = new CartManager(req.db);
        const ticketManager = new TicketManager(req.db);

        const user = await userManager.getById(userId)
        const { amount, payment_method, rid } = req.body;
        if (!rid) throw new CustomError('Missing arguments', 'Debes iniciar el día primero', 2);
        const activeResume = await resumeManager.getResumeById(rid);
        if (!payment_method) throw new CustomError('Missing arguments', 'Selecciona un método de pago', 2);
        if (amount <= 0) throw new CustomError('Invalid amount', 'El total no puede ser 0 o menor que 0', 1);
        if (!user) throw new CustomError('Sesion expired', 'Sesión expirada, volvé a iniciar sesión', 6);
        const cart = await cartManager.getCartById(user.cart._id);
        if (cart.products.length === 0) throw new CustomError('No products', 'Debes agregar al menos un producto', 2)



        const productsCart = [];
        const productIds = cart.products.map(p => p.product._id); // Armamos lista de IDs de productos

        // 📦 Traemos los productos desde la DB (usamos $in y lean para eficiencia)
        const dbProducts = await productManager.getSearch({ _id: { $in: productIds } }, null, session);
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
            await productManager.update(prod._id, { $inc: { stock: -item.quantity } }, session)

        }

        // 🎫 Creamos el ticket en la base de datos
        const ticket = new TicketDTO(productsCart, amount, user._id, payment_method);
        const newTicket = await ticketManager.createTicket(ticket, session);

        // 📈 Actualizamos el resumen (cantidad de ventas y monto total)

        // ✅ Actualizar resumen con ventas, monto, tickets
        activeResume.sales += 1;
        activeResume.amount += amount;
        activeResume.tickets.push({ ticket: newTicket._id });

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
        await resumeManager.updateFull(activeResume._id, activeResume, session)
        // await activeResume.save({ session });

        // 🧹 Vaciamos el carrito del usuario
        const updatedCart = await cartManager.update(user.cart._id, { $set: { products: [] } }, session);
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

    } catch (error) {
        console.log(error)
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
}

export default { getAllTickets, createTicket, getTicketById };