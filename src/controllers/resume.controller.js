import ResumeManager from "../dao/service/resume.service.js";
import { TicketManager } from "../dao/service/ticket.service.js";
import CustomError from "../errors/custom.error.js";
import { formatDate } from "../utils.js";

const getSummaries = async(req, res, next)=>{
    try {
        const {cat} = req.params;
        const {page=1} = req.query;
        const summaries = await ResumeManager.getAllResumeByCat(cat, page);
        if(!summaries) throw new CustomError('No data', 'No hay resúmenes disponibles', 4);
        return res.status(200).send({status:'success', payload:summaries});
    } catch (error) {
        next(error);
    }
}

const getSummaryById = async(req, res, next)=>{
    try {
        const {sid} = req.params;
        const summary = await ResumeManager.getResumeById(sid);
        if(!summary) throw new CustomError('No data', 'No existe el resumen', 4);
        summary.products.forEach((product)=>{
            let totalCostPrice = Number(product.product.costPrice) * Number(product.quantity);
            product.ganancia = Number(product.total) - totalCostPrice;
            product.porcentajeGanancia = Number(((product.product.sellingPrice - product.product.costPrice) / product.product.costPrice) * 100);
        })
        console.log(summary)
        return res.status(200).send({status:'success', payload:summary});
    } catch (error) {
        next(error);
    }
}

const createSummary = async(req, res, next)=>{
    try {
        const {cat} = req.params;
        const date = new Date();
        if(cat === 'diary'){
            const user = req.user;
            const {initAmount} = req.body;
            const newResume = await ResumeManager.createResume({init_date: {init: date, seller: user}, category: cat, initAmount: parseInt(initAmount), sales: 0});
            return res.status(200).send({status:'success', message: 'Día comenzado !', id: newResume._id});
        }
        if(cat === 'monthly'){
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const summaryExist = await ResumeManager.getMonthResume(month, year);
            if(summaryExist) throw new CustomError('Data already exist', 'El resumen del mes ya fue creado', 6);
            const orders = await TicketManager.getMonthOrders(date);
            const arrayProds = [];
            const arrayMethods = [];
            let totalAmount = 0;
            orders.forEach(order =>{
                totalAmount += Number(order.amount);
                const existMethod = arrayMethods.findIndex(method => method.method === order.payment_method);
                if(existMethod !== -1){
                    arrayMethods[existMethod].amount += Number(order.amount);
                } else{
                    arrayMethods.push({method: order.payment_method, amount: Number(order.amount)});
                }

                order.products.forEach(producto=>{
                    const existProd = arrayProds.findIndex(prod => prod.product.id === producto.product.id);
                    if(existProd !== -1){
                        arrayProds[existProd].quantity += Number(producto.quantity);
                        arrayProds[existProd].total += Number(producto.totalPrice);
                    }else{
                        arrayProds.push({product: {id: producto.product.id, title: producto.product.title, code: producto.product.code, costPrice: producto.product.costPrice, sellingPrice: producto.product.sellingPrice}, quantity: producto.quantity, total: producto.totalPrice});
                    }
                })
            })
            arrayMethods.forEach(meth =>{
                meth.amount = meth.amount.toFixed(2)
            })
            totalAmount = totalAmount.toFixed(2);
            await ResumeManager.createResume({amount: totalAmount, products: arrayProds, month: month, category: cat, year: year, sales: orders.length, amount_per_method: arrayMethods});
            return res.status(200).send({status: 'success', message: 'Resumen del mes creado !'})
        }
    } catch (error) {
        console.log(error)
        next(error);
    }
}

const endDay = async(req, res, next) =>{
    try {
        const {rid} = req.params;
        const user = req.user;
        const summaryNow = await ResumeManager.getResumeById(rid);
        const date = new Date();
        const orders = await TicketManager.getOrdersDate(summaryNow.init_date.init, date);
        const arrayProds = [];
        const arrayMethods = [];
        // const sellsPerUser = [];
        let totalAmount = 0;
        orders.forEach(order =>{
            totalAmount += Number(order.amount);
            // const userExist = sellsPerUser.findIndex(user => user.seller === order.seller);
            // if(userExist >= 0){
            //     sellsPerUser[userExist]
            // }
            const existMethod = arrayMethods.findIndex(method => method.method === order.payment_method);
            if(existMethod !== -1){
                arrayMethods[existMethod].amount += Number(order.amount);
            } else{
                arrayMethods.push({method: order.payment_method, amount: Number(order.amount)});
            }
        
            order.products.forEach(producto=>{
                const existProd = arrayProds.findIndex(prod => prod.product.id === producto.product.id);
                if(existProd !== -1){
                    arrayProds[existProd].quantity += Number(producto.quantity);
                    arrayProds[existProd].total += Number(producto.totalPrice);
                }else{
                    arrayProds.push({product: {id: producto.product.id, title: producto.product.title, code: producto.product.code, costPrice: producto.product.costPrice, sellingPrice: producto.product.sellingPrice}, quantity: producto.quantity, total: producto.totalPrice});
                }
            })
        })
        arrayMethods.forEach(meth =>{
            meth.amount = meth.amount.toFixed(2)
        })
        totalAmount = totalAmount.toFixed(2);
        await ResumeManager.endDayResume(totalAmount, arrayProds, date, rid, orders.length, arrayMethods, user);
        return res.status(200).send({status:'success', message: 'Día terminado !', resumeId: rid})
    } catch (error) {
        next(error);
    }
}

const addExpense = async(req, res, next)=>{
    try {
        const {rid} = req.params;
        const {expense, amount} = req.body;
        if(!expense || !amount) throw new CustomError('No data', 'Debes completar todos los campos', 2);
        await ResumeManager.addExpense(rid, {expense, amount});
        return res.status(200).send({status: 'success', message: 'Gasto añadido!'});
    } catch (error) {
        next(error);
    }
}

const deleteExpense = async(req, res, next)=>{
    try {
        const {rid} = req.params;
        const {index} = req.body;
        await ResumeManager.deleteExpense(rid, index);
        return res.status(200).send({status:'success', message: 'Gasto eliminado!'})
    } catch (error) {
        next(error);
    }
}



export default {createSummary, endDay, addExpense, deleteExpense, getSummaries, getSummaryById};