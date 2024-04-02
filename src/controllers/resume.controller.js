import ResumeManager from "../dao/service/resume.service.js";
import { TicketManager } from "../dao/service/ticket.service.js";
import CustomError from "../errors/custom.error.js";
import { formatDate } from "../utils.js";

const createSummary = async(req, res, next)=>{
    try {
        const {cat} = req.params;
        const date = new Date();
        if(cat === 'diary'){
            const {initAmount} = req.body;
            const newResume = await ResumeManager.createResume({init_date: date, category: cat, initAmount: parseInt(initAmount), sales: 0});
            return res.status(200).send({status:'success', message: 'Día comenzado !', id: newResume._id});
        }
        if(cat === 'monthly'){
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const summaryExist = await ResumeManager.getMonthResume(month, year);
            if(summaryExist) throw new CustomError('Data already exist', 'El resumen del mes ya fue creado', 6);
            const orders = await TicketManager.getMonthOrders(date);
            const arrayProds = [];
            let totalAmount = 0;
            orders.forEach(order =>{
                totalAmount += Number(order.amount);
                order.products.forEach(product=>{
                    const existProd = arrayProds.findIndex(prod => prod.product.equals(product.product));
                    if(existProd !== -1){
                        arrayProds[existProd].quantity += Number(product.quantity);
                        arrayProds[existProd].total += Number(product.totalPrice);
                    }else{
                        arrayProds.push({product: product.product, quantity: product.quantity, total: product.totalPrice});
                    }
                })
            })
            totalAmount = totalAmount.toFixed(2);
            await ResumeManager.createResume({amount: totalAmount, products: arrayProds, month: month, category: cat, year: year, sales: orders.length});
            return res.status(200).send({status: 'success', message: 'Resumen del mes creado !'})
        }
    } catch (error) {
        next(error);
    }
}

const endDay = async(req, res, next) =>{
    try {
        const {rid} = req.params;
        const summaryNow = await ResumeManager.getResumeById(rid);
        const date = new Date();
        const orders = await TicketManager.getOrdersDate(summaryNow.init_date, date);
        const arrayProds = [];
        let totalAmount = 0;
        orders.forEach(order =>{
            totalAmount += Number(order.amount);
            order.products.forEach(product=>{
                const existProd = arrayProds.findIndex(prod => prod.product.equals(product.product));
                if(existProd !== -1){
                    arrayProds[existProd].quantity += Number(product.quantity);
                    arrayProds[existProd].total += Number(product.totalPrice);
                }else{
                    arrayProds.push({product: product.product, quantity: product.quantity, total: product.totalPrice});
                }
            })
        })
        totalAmount = totalAmount.toFixed(2);
        await ResumeManager.endDayResume(totalAmount, arrayProds, date, rid, orders.length);
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
        return res.status(200).send({status: 'success', message: 'Expensa añadida!'});
    } catch (error) {
        next(error);
    }
}



export default {createSummary, endDay, addExpense};