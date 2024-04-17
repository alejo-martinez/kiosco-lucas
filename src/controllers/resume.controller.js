import ResumeManager from "../dao/service/resume.service.js";
import { TicketManager } from "../dao/service/ticket.service.js";
import CustomError from "../errors/custom.error.js";
import { formatDate } from "../utils.js";

const createSummary = async(req, res, next)=>{
    try {
        const {cat} = req.params;
        const date = new Date();
        if(cat === 'diary'){
            const user = req.user;
            const {initAmount} = req.body;
            const newResume = await ResumeManager.createResume({init_date: {init: date, seller: user._id}, category: cat, initAmount: parseInt(initAmount), sales: 0});
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
        await ResumeManager.endDayResume(totalAmount, arrayProds, date, rid, orders.length, arrayMethods, user._id);
        res.status(200).send({status:'success', message: 'Día terminado !'})
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



export default {createSummary, endDay, addExpense, deleteExpense};