
import { getCartModel, getProductModel, getResumeModel, getTicketModel, getUserModel } from "../models/factory.js";
import { io } from "../../app.js";
import mongoose from "mongoose";

export class TicketManager {
    constructor(connection) {
        this.Ticket = getTicketModel(connection);
        this.User = getUserModel(connection);
        this.Product = getProductModel(connection);
        this.Cart = getCartModel(connection);
        this.Resume = getResumeModel(connection);

    }
    async getAll(page, usuarioId) {
        const numericPage = Number(page);
        const { docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages } = await this.Ticket.paginate({ seller: usuarioId }, { lean: true, page: numericPage | 1, limit: 25, sort: { created_at: -1 } });
        return { docs, hasPrevPage, hasNextPage, prevPage, nextPage, totalPages, page };
    }

    async getById(id) {
        return await this.Ticket.findById(id).populate({ path: 'seller', model: this.User }).lean();
    }

    async getMonthOrders(date) {
        const actualMonth = date.getMonth();
        const actualYear = date.getFullYear();
        const initDate = new Date(actualYear, actualMonth, 1);
        const endDate = new Date(actualYear, actualMonth + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        return await this.Ticket.find({ created_at: { $gte: initDate, $lte: endDate } }).lean();
    }

    async createTicket(userId, { amount, payment_method, rid }, db) {
        const session = await mongoose.startSession();
        session.startTransaction();
        console.log('Iniciando transacción de ticket...');
        try {
            // 1️⃣ Validaciones iniciales
            if (!rid) throw new Error("Debes iniciar el día primero");
            if (!payment_method) throw new Error("Selecciona un método de pago");
            if (amount <= 0) throw new Error("El total no puede ser 0 o menor que 0");
            const cartManager = new this.Cart(db);
            const productManager = new this.Product(db);
            const resumeManager = new this.Resume(db);
            const ticketManager = new this.Ticket(db);
            // 2️⃣ Traer usuario y carrito
            const user = await cartManager.getUser(userId, session);
            const cart = await cartManager.getCartByUser(userId, session);
            if (!cart.products.length) throw new Error("Debes agregar al menos un producto");

            // 3️⃣ Traer resumen activo
            const activeResume = await resumeManager.getResumeById(rid, session);

            // 4️⃣ Preparar productos y actualizar stock
            const { productsCart, lowStockProducts, bulkOps } = await this.prepareProducts(cart, session, db);

            // 5️⃣ Actualizar stock en bulk
            await productManager.bulkWriteStock(bulkOps, session);

            // 6️⃣ Emitir alertas de stock bajo
            if (lowStockProducts.length) io.emit('lowstock', { products: lowStockProducts });

            // 7️⃣ Crear ticket
            const newTicket = await ticketManager.createTicket({ productsCart, amount, userId, payment_method }, session);

            // 8️⃣ Actualizar resumen y carrito en paralelo
            await Promise.all([
                this.updateResume(activeResume, cart, newTicket, payment_method, amount, session, db),
                cartManager.emptyCart(user.cart._id, session)
            ]);
            console.log('Transacción de ticket completada.');
            await session.commitTransaction();
            session.endSession();

            return newTicket;
        } catch (err) {
            console.error("Error en createTicket:", err);
            await session.abortTransaction();
            session.endSession();
            throw err;
        }
    }

    async prepareProducts(cart, session, db) {
        try {
            console.log('Preparando productos...')
            const productIds = cart.products.map(p => p.product._id);
            const productManager = new this.Product(db);
            const dbProducts = await productManager.getSearch({ _id: { $in: productIds } }, "title stock costPrice sellingPrice code", session);

            const productsCart = [];
            const lowStockProducts = [];
            const bulkOps = [];

            for (const item of cart.products) {
                const prod = item.product;
                const dbProduct = dbProducts.find(p => p._id.toString() === prod._id.toString());
                if (!dbProduct) throw new Error(`Producto ${prod.title} no encontrado`);

                const remainingStock = dbProduct.stock - item.quantity;
                if (remainingStock < 0) throw new Error(`Stock insuficiente para ${prod.title}`);

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

                if (remainingStock <= 2) lowStockProducts.push(prod._id);

                bulkOps.push({
                    updateOne: {
                        filter: { _id: prod._id },
                        update: { $inc: { stock: -item.quantity } }
                    }
                });
            }
            console.log('Productos preparados');
            return { productsCart, lowStockProducts, bulkOps };
        } catch (error) {
            console.error("Error preparando productos:", error);
            throw error;
        }
    }

    async updateResume(activeResume, cart, newTicket, payment_method, amount, session, db) {
        try {
            console.log('Actualizando resumen...')

            // Actualizar tickets
            activeResume.sales += 1;
            activeResume.amount += amount;
            activeResume.tickets.push({ ticket: newTicket._id });

            // Actualizar productos en resumen
            for (const item of cart.products) {
                const prod = item.product;
                const existingIndex = activeResume.products.findIndex(p => p.product.id === prod._id.toString());
                if (existingIndex !== -1) {
                    activeResume.products[existingIndex].quantity += item.quantity;
                    activeResume.products[existingIndex].total += item.totalPrice;
                } else {
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
            console
            // Actualizar métodos de pago
            const methodIndex = activeResume.amount_per_method.findIndex(m => m.method === payment_method);
            if (methodIndex !== -1) {
                activeResume.amount_per_method[methodIndex].amount += amount;
            } else {
                activeResume.amount_per_method.push({ method: payment_method, amount });
            }
            const resumeManager = new this.Resume(db);
            await resumeManager.updateFull(activeResume._id, activeResume, session);
            console.log('Resumen actualizado');
        } catch (error) {
            console.error("Error actualizando resumen:", error);
            throw error;
        }
    }

    async getOrdersDate(initDate, finishDate, db) {
        const ticketManager = new this.Ticket(db);
        return await ticketManager.find({ created_at: { $gte: initDate, $lt: finishDate } }).lean();
    }
}