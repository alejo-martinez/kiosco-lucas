import ResumeManager from "../dao/service/resume.service.js";
import { TicketManager } from "../dao/service/ticket.service.js";
import CustomError from "../errors/custom.error.js";
import { calcularMasVendidos, formatDate } from "../utils.js";

const getSummaries = async (req, res, next) => {
    try {
        const { cat } = req.params;
        const { page = 1 } = req.query;
        const resumeManager = new ResumeManager(req.db);
        const summaries = await resumeManager.getAllResumeByCat(cat, page);
        if (!summaries) throw new CustomError('No data', 'No hay resúmenes disponibles', 4);
        // console.log(summaries)
        return res.status(200).send({ status: 'success', payload: summaries });
    } catch (error) {
        next(error);
    }
}

const getSummaryById = async (req, res, next) => {
    try {
        const { sid } = req.params;
        const resumeManager = new ResumeManager(req.db);
        const ticketManager = new TicketManager(req.db);
        // const summary = await resumeManager.getResumeById(sid);
        const summary = await resumeManager.getResumeById(sid);
        if (!summary) throw new CustomError('No data', 'No existe el resumen', 4);
        let gananciaBruta = 0;
        let porcentajeGananciaTotal = 0;
        let duration;
        summary.products.forEach((product) => {
            let totalCostPrice = Number(product.product.costPrice) * Number(product.quantity);
            product.ganancia = Number(product.total) - totalCostPrice;
            product.porcentajeGanancia = Number(((product.product.sellingPrice - product.product.costPrice) / product.product.costPrice) * 100);
            gananciaBruta += ((Number(product.product.sellingPrice) - Number(product.product.costPrice)) * product.quantity);
        })

        const ventasPorHora = {}
        if (summary.finish_date) {
            summary.tickets.forEach(entry => {
                // console.log(entry)
                const hour = new Date(entry.ticket.created_at).getHours();
                ventasPorHora[hour] = (ventasPorHora[hour] || 0) + 1;
            });

            // Encontrar la hora con más ventas
            let horaPico = null;
            let maxVentas = 0;

            for (const [hora, cantidad] of Object.entries(ventasPorHora)) {
                if (cantidad > maxVentas) {
                    maxVentas = cantidad;
                    horaPico = hora;
                }
            }
            summary.peakHour = `${horaPico}:00 hs (${maxVentas} ventas)`;
            duration = summary.finish_date.end - summary.init_date.init;
            const duracionHoras = Math.floor(duration / (1000 * 60 * 60));
            const duracionMinutos = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

            const duracion = `${duracionHoras}h ${duracionMinutos}m`;
            summary.duration = duracion;
        }
        summary.ganancy = gananciaBruta;
        porcentajeGananciaTotal = (Number(gananciaBruta) / Number(summary.amount)) * 100;
        summary.ganancyPercentage = porcentajeGananciaTotal;
        const statics = calcularMasVendidos(summary);
        summary.mostSelled = statics.masVendido;
        summary.topSelled = statics.topVendidos;
        const totalEft = summary.amount_per_method.find(m => m.method === 'eft');
        if (totalEft) summary.checkout = Number(summary.initAmount) + Number(totalEft.amount);

        return res.status(200).send({ status: 'success', payload: summary });
    } catch (error) {
        next(error);
    }
}

const getActiveSummary = async (req, res, next) => {
    try {
        const resumeManager = new ResumeManager(req.db);
        const summaries = await resumeManager.getSummaries();
        const activeSummary = summaries.find(summary => !summary.finish_date);
        if (activeSummary) {
            return res.status(200).send({ status: 'success', message: 'Hay un resumen activo', payload: activeSummary });
        } else {
            return res.status(200).send({ status: 'success', message: 'No hay resúmenes activos', payload: null });
        }
    } catch (error) {
        next(error);
    }
}

const createSummary = async (req, res, next) => {
    try {
        const { cat } = req.params;
        const date = new Date();
        const resumeManager = new ResumeManager(req.db);
        const ticketManager = new TicketManager(req.db);
        if (cat === 'diary') {
            const user = req.user;
            const { initAmount } = req.body;
            const actualMonth = date.getMonth() + 1;
            const actualYear = date.getFullYear();
            const newResume = await resumeManager.createResume({ init_date: { init: date, seller: user }, category: cat, initAmount: parseInt(initAmount), sales: 0, month: actualMonth, year: actualYear });
            return res.status(200).send({ status: 'success', message: 'Día comenzado !', id: newResume._id });
        }
        if (cat === 'monthly') {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const summaryExist = await resumeManager.getMonthResume(month, year);
            if (summaryExist) throw new CustomError('Data already exist', 'El resumen del mes ya fue creado', 6);
            const orders = await ticketManager.getMonthOrders(date);
            const arrayProds = [];
            const arrayMethods = [];
            let totalAmount = 0;
            orders.forEach(order => {
                totalAmount += Number(order.amount);
                const existMethod = arrayMethods.findIndex(method => method.method === order.payment_method);
                if (existMethod !== -1) {
                    arrayMethods[existMethod].amount += Number(order.amount);
                } else {
                    arrayMethods.push({ method: order.payment_method, amount: Number(order.amount) });
                }

                order.products.forEach(producto => {
                    const existProd = arrayProds.findIndex(prod => prod.product.id === producto.product.id);
                    if (existProd !== -1) {
                        arrayProds[existProd].quantity += Number(producto.quantity);
                        arrayProds[existProd].total += Number(producto.totalPrice);
                    } else {
                        arrayProds.push({ product: { id: producto.product.id, title: producto.product.title, code: producto.product.code, costPrice: producto.product.costPrice, sellingPrice: producto.product.sellingPrice }, quantity: producto.quantity, total: producto.totalPrice });
                    }
                })
            })
            arrayMethods.forEach(meth => {
                meth.amount = meth.amount.toFixed(2)
            })
            totalAmount = totalAmount.toFixed(2);
            await resumeManager.createResume({ amount: totalAmount, products: arrayProds, month: month, category: cat, year: year, sales: orders.length, amount_per_method: arrayMethods });
            return res.status(200).send({ status: 'success', message: 'Resumen del mes creado !' })
        }
    } catch (error) {
        console.log(error)
        next(error);
    }
}

const endDay = async (req, res, next) => {
    try {
        const { rid } = req.params;
        const user = req.user;
        const resumeManager = new ResumeManager(req.db);
        // const summaryNow = await resumeManager.getResumeById(rid);
        const date = new Date();
        await resumeManager.endDayResume(date, rid, user)

        return res.status(200).send({ status: 'success', message: 'Día terminado !', resumeId: rid })
    } catch (error) {
        next(error);
    }
}

const addExpense = async (req, res, next) => {
    try {
        const { rid } = req.params;
        const { expense, amount } = req.body;
        if (!expense || !amount) throw new CustomError('No data', 'Debes completar todos los campos', 2);
        const resumeManager = new ResumeManager(req.db);
        await resumeManager.addExpense(rid, { expense, amount });
        return res.status(200).send({ status: 'success', message: 'Gasto añadido!' });
    } catch (error) {
        next(error);
    }
}

const deleteExpense = async (req, res, next) => {
    try {
        const { rid } = req.params;
        const { index } = req.body;
        const resumeManager = new ResumeManager(req.db);
        await resumeManager.deleteExpense(rid, index);
        return res.status(200).send({ status: 'success', message: 'Gasto eliminado!' })
    } catch (error) {
        next(error);
    }
}

const getMonthResume = async (req, res, next) => {
    try {
        const { month } = +req.params;
        const date = new Date();
        const actualYear = date.getFullYear();
        const resumeManager = new ResumeManager(req.db);
        const resumes = await resumeManager.getMonthResume(month, actualYear);

    } catch (error) {
        next(error);
    }
}



export default { createSummary, endDay, addExpense, deleteExpense, getSummaries, getSummaryById, getActiveSummary };