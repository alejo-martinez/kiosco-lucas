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
            const arrayId = [];
            let totalAmount = 0;
            for (let index = 0; index < orders.length; index++) {
                arrayId.push({order: orders[index]._id});
                totalAmount += Number(orders[index].amount);
            }
            await ResumeManager.createResume({amount: totalAmount, orders: arrayId, month: month, category: cat, year: year});
            return res.status(200).send({status: 'success', message: 'Resumen del mes creado !'})
        }
    } catch (error) {
        next(error);
    }
}

const endDay = async(req, res, next) =>{
    try {
        const date =  new Date().setHours(0, 0, 0, 0);
        const orders = await TicketManager.getOrdersDate(date);
        const arrayProds = [];
        let totalAmount = 0;
        orders.forEach(order =>{
            let exist  = false;
            for (let index = 0; index < order.products.length; index++) {
                if (personas[i].nombre === objeto.nombre) {
                    personas[i].edad = objeto.edad;
                    exist=true;
                    encontrado = true;
                    break;
                }
                
            }
            // order.products.forEach(prod =>{
            //     const productExist = arrayProds.find(product => product.id === prod._id);
            //     if(productExist){
            //         productExist.quantity += prod.quantity;
            //         productExist.total += prod.totalPrice;
            //     }else{

            //     }
            // })
        })
        // for (let index = 0; index < orders.length; index++) {
        //     arrayId.push({order: orders[index]._id});
        //     totalAmount += orders[index].amount;   
        // }
        await ResumeManager.endDayResume(totalAmount, arrayId, date);
        res.status(200).send({status:'succes', message: 'Día terminado !'})
    } catch (error) {
        next(error);
    }
}



export default {createSummary, endDay}