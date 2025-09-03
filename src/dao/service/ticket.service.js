
import { getCartModel, getProductModel, getResumeModel, getTicketModel, getUserModel } from "../models/factory.js";
import { io } from "../../app.js";
// import mongoose from "mongoose";
import { getTenantConnection } from "../../tenants/connManager.js";
import { TicketDTO } from "../../dto/ticketDTO.js";

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
        console.log(id)

        const t = await this.Ticket.findById(id).populate({ path: 'seller', model: this.User }).lean();
        console.log(t)
        return t
    }

    async getMonthOrders(date) {
        const actualMonth = date.getMonth();
        const actualYear = date.getFullYear();
        const initDate = new Date(actualYear, actualMonth, 1);
        const endDate = new Date(actualYear, actualMonth + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        return await this.Ticket.find({ created_at: { $gte: initDate, $lte: endDate } }).lean();
    }

    async createTicket(userId, { amount, payment_method, rid }, db, slug) {
        // console.log(db)
        const tenantConnection = await getTenantConnection(slug);
        const session = await tenantConnection.startSession();
        session.startTransaction();
        console.log('Iniciando transacción de ticket...');
        try {
            // 1️⃣ Validaciones iniciales
            if (!rid) throw new Error("Debes iniciar el día primero");
            if (!payment_method) throw new Error("Selecciona un método de pago");
            if (amount <= 0) throw new Error("El total no puede ser 0 o menor que 0");
            const cartManager = this.Cart;
            const productManager = this.Product;
            const resumeManager = this.Resume;
            const ticketManager = this.Ticket;
            const userManager = this.User;
            // 2️⃣ Traer usuario y carrito
            // console.log(userId)
            const user = await userManager.findOne({ _id: userId }).populate({ path: 'cart', model: this.Cart }).session(session).lean();
            const cart = await cartManager.findOne({ _id: user.cart._id }).populate({ path: 'products.product', model: this.Product }).session(session).lean();
            console.log(cart)
            if (!user) throw new Error("Usuario no encontrado");
            if (!user.cart) throw new Error("Carrito no encontrado");
            //
            // const cart = await cartManager.getCartByUser(userId, session);
            if (user.cart.products.length === 0) throw new Error("Debes agregar al menos un producto");

            // 3️⃣ Traer resumen activo
            const activeResume = await resumeManager.findOne({ _id: rid }).session(session).lean();

            // 4️⃣ Preparar productos y actualizar stock
            const { productsCart, lowStockProducts, bulkOps } = await this.prepareProducts(cart, session, db);

            // 5️⃣ Actualizar stock en bulk
            await productManager.bulkWrite(bulkOps, { session });
            // await productManager.bulkWriteStock(bulkOps, session);

            // 6️⃣ Emitir alertas de stock bajo
            if (lowStockProducts.length) io.emit('lowstock', { products: lowStockProducts });

            // 7️⃣ Crear ticket
            const ticketDto = new TicketDTO(productsCart, amount, userId, payment_method);

            const newTicket = await ticketManager.create(ticketDto, session);


            // 8️⃣ Actualizar resumen y carrito en paralelo
            await Promise.all([
                this.updateResume(activeResume, cart, newTicket[0], payment_method, amount, session, db),
                // cartManager.emptyCart(user.cart._id, session)
                await cartManager.findOneAndUpdate({ _id: cart._id }, { $set: { products: [] } }, { new: true, session })
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
            const productManager = this.Product;
            const dbProducts = await productManager.find({ _id: { $in: productIds } }).session(session).lean();
            // const dbProducts = await productManager.getSearch({ _id: { $in: productIds } }, "title stock costPrice sellingPrice code", session);

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
            console.log('Actualizando resumen...');

            // Construir productos actualizados
            const updatedProducts = [...activeResume.products];
            for (const item of cart.products) {
                const prod = item.product;
                const index = updatedProducts.findIndex(p => p.product.id === prod._id.toString());
                if (index !== -1) {
                    updatedProducts[index].quantity += item.quantity;
                    updatedProducts[index].total += item.totalPrice;
                } else {
                    updatedProducts.push({
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

            // Actualizar amount_per_method
            const updatedMethods = [...activeResume.amount_per_method];
            const methodIndex = updatedMethods.findIndex(m => m.method === payment_method);
            if (methodIndex !== -1) {
                updatedMethods[methodIndex].amount += amount;
            } else {
                updatedMethods.push({ method: payment_method, amount });
            }

            // Ejecutar la actualización usando $inc y $push
            await this.Resume.updateOne(
                { _id: activeResume._id },
                {
                    $inc: { sales: 1, amount: amount },
                    $push: { tickets: { ticket: newTicket._id } },
                    $set: { products: updatedProducts, amount_per_method: updatedMethods }
                },
                { session }
            );

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