import ResumeManager from "../dao/service/resume.service.js";
import { TicketManager } from "../dao/service/ticket.service.js";
import CustomError from "../errors/custom.error.js";

const createSummary = async(req, res, next)=>{
    try {
        const {cat} = req.params;
        const date = new Date();
        if(cat === 'diary'){
            date.setHours(0, 0, 0, 0);
            const {initAmount} = req.body;
            const summaryExist = await ResumeManager.getTodayResume(date);
            if(summaryExist) throw new CustomError('Data already exist', `El resumen del día de hoy ya fue creado`, 6);
            await ResumeManager.createResume({date: date, category: cat, initAmount: parseInt(initAmount)});
            return res.status(200).send({status:'success', message: 'Día comenzado !'})
        }
        if(cat === 'monthly'){
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const summaryExist = await ResumeManager.getMonthResume(month, year);
            if(summaryExist) throw new CustomError('Data already exist', 'El resumen del mes ya fue creado', 6);
            const orders = await TicketManager.getMonthOrders(date);
            // console.log(orders)
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
            // await ResumeManager.createResume({amount: totalAmount, orders: arrayProds, month: month, category: cat, year: year});
            return res.status(200).send({status: 'success', message: 'Resumen del mes creado !'})
        }
    } catch (error) {
        next(error);
    }
}

const endDay = async(req, res, next) =>{
    try {
        const date = new Date().setHours(0, 0, 0, 0);
        const orders = await TicketManager.getOrdersDate(date);
        const summaryExist = await ResumeManager.getTodayResume(date);
        if(summaryExist.amount > 0) throw new CustomError('Data already exist', 'El día ya fue cerrado', 6);
        const arrayProds = [];
        let totalAmount = 0;
        orders.forEach(order =>{
            totalAmount += Number(order.amount);
            order.products.forEach(product=>{
                const existProd = arrayProds.findIndex(prod => prod.product.equals(product.product));
                console.log(existProd)
                if(existProd !== -1){
                    arrayProds[existProd].quantity += Number(product.quantity);
                    arrayProds[existProd].total += Number(product.totalPrice);
                }else{
                    arrayProds.push({product: product.product, quantity: product.quantity, total: product.totalPrice});
                }
            })
        })
        totalAmount = totalAmount.toFixed(2);
        await ResumeManager.endDayResume(totalAmount, arrayProds, date);
        res.status(200).send({status:'succes', message: 'Día terminado !'})
    } catch (error) {
        next(error);
    }
}



export default {createSummary, endDay}