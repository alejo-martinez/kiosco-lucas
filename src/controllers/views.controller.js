import CartManager from "../dao/service/cart.service.js";
import ProductManager from "../dao/service/product.service.js";
import ResumeManager from "../dao/service/resume.service.js";
import { TicketManager } from "../dao/service/ticket.service.js";
import UserManager from "../dao/service/user.service.js";
import { formatDate, formatDateWithHours, paymentMethod } from "../utils.js";


const login = (req, res, next) => {
    try {
        const user = req.user;
        if (user) res.redirect('/');
        else res.render('login');
    } catch (error) {
        next(error);
    }
}

const register = (req, res, next) => {
    try {
        res.render('register')
    } catch (error) {
        next(error);
    }
}

const home = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) res.redirect('/login');
        else {
            const summaries = await ResumeManager.getSummaries()
            let summaryDay;
            summaries.forEach(summary=>{
                if(!summary.finish_date && summary.category === 'diary') summaryDay = summary; 
            })

            const carrito = await CartManager.getCartById(user.cart._id);
            let total = 0;
            carrito.products.forEach(prod => {
                prod.totalPrice = (Number(prod.product.sellingPrice) * Number(prod.quantity));
                total += Number(prod.totalPrice.toFixed(2));
                prod.totalPrice = prod.totalPrice.toFixed(2)
            });
            total = Number.isInteger(total) ? total.toFixed(2) : total.toFixed(2);
            let admin;
            if (user.role === 'admin') {
                admin = true;
                res.render('home', { user, admin, carrito, total, summaryDay });
            }
            else {
                res.render('home', { user, carrito, total, summaryDay })
            }
        }
    } catch (error) {
        next(error);
    }
}

const showProd = async (req, res, next) => {
    try {
        const { pid } = req.params;
        const user = req.user;

        const admin = true;
        const btnInicio = true;
        const producto = await ProductManager.getById(pid);
        res.render('showprod', { producto, user, admin, btnInicio })

    } catch (error) {
        next(error);
    }
}


const panelOption = async (req, res, next) => {
    try {
        const btnInicio = true;
        const user = req.user;
        const admin = true
        const { option, model } = req.params;

        if (option === 'create') {
            if (model === 'prod') res.render('createprod', { btnInicio, admin, user });
            if (model === 'user') res.render('register', { btnInicio, admin, user });
        }
        if (option === 'update') {
            if (model === 'prod') {
                const { page = 1 } = req.query;
                const response = await ProductManager.getAll(page);
                const products = response.docs;
                const nextPage = response.nextPage;
                const prevPage = response.prevPage;
                const hasNextPage = response.hasNextPage;
                const hasPrevPage = response.hasPrevPage;
                res.render('updateprod', { btnInicio, admin, user, products, nextPage, prevPage, hasNextPage, hasPrevPage });
            }
            if (model === 'user') {
                const arrayUsers = await UserManager.getAll();
                const users = arrayUsers.filter(u => u.role !== 'admin');
                res.render('updateuser', { btnInicio, admin, user, users });
            }
        }

    } catch (error) {
        next(error);
    }
}

const getOrders = async (req, res, next) => {
    try {
        const user = req.user;

        const btnInicio = true;
        let admin;
        if(user.role === 'admin') admin = true;
        const { page = 1 } = req.query;
        const response = await TicketManager.getAll(page);
        const tickets = response.docs;
        tickets.forEach(ticket => {
            ticket.created_at = formatDateWithHours(ticket.created_at);
        })
        res.render('orders', { user, admin, page, btnInicio, orders: tickets, nextPage: response.nextPage, prevPage: response.prevPage, hasNextPage: response.hasNextPage, hasPrevPage: response.hasPrevPage });

    } catch (error) {
        next(error);
    }
}

const showOrder = async (req, res, next) => {
    try {
        const user = req.user;
        const { tid } = req.params;
        let admin;
        if(user.role === 'admin') admin = true;
        const btnInicio = true;
        const ticket = await TicketManager.getById(tid);
        ticket.payment_method = paymentMethod(ticket.payment_method);
        if (!ticket) throw new CustomError('No Data', 'No existe la orden solicitada', 4);
        ticket.created_at = formatDate(ticket.created_at);
        res.render("showorder", { admin, user, ticket, btnInicio });

    } catch (error) {
        next(error);
    }
}

const showUser = async (req, res, next) => {
    try {
        const { uid } = req.params;
        const user = req.user;
        const admin = true;
        const btnInicio = true;
        const usuario = await UserManager.getById(uid);
        res.render('showuser', { user, admin, btnInicio, usuario });

    } catch (error) {
        next(error);
    }
}

const getAllSummary = async (req, res, next) => {
    try {
        const { cat } = req.params;
        const { page = 1 } = req.query;
        const user = req.user;
        const data = await ResumeManager.getAllResumeByCat(cat, page);

        const btnInicio = true;
        let admin;
        if(user.role === 'admin') admin = true;
        if (!data) res.render('summaries', {btnInicio, admin, user})
        else {
            if(cat === 'diary'){
                data.docs.forEach(summary =>{
                    summary.date = formatDate(summary.init_date.init);
                })
            }
            const summaries = data.docs;
            const nextPage = data.nextPage;
            const prevPage = data.prevPage;
            const hasNextPage = data.hasNextPage;
            const hasPrevPage = data.hasPrevPage;
            const category = `${cat === 'diary' ? 'diarios' : 'mensuales'}`
            res.render('summaries', { btnInicio, admin, user, summaries, nextPage, prevPage, hasNextPage, hasPrevPage, category, page});
        }
    } catch (error) {
        next(error);
    }
}

const showSummary = async(req, res, next) => {
    try {
        const {sid} = req.params;
        const user = req.user;
        const summary = await ResumeManager.getResumeById(sid);

        let category;
        let mes;
        if(summary.category === 'monthly'){
            const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            category = 'mes';
            mes = months[Number(summary.month) - 1];
            summary.amount_per_method.forEach(method =>{
                method.method = paymentMethod(method.method);
            })
        }
        if(summary.category === 'diary'){
            if(summary.amount_per_method.length > 0){
                summary.amount_per_method.forEach(method =>{
                    method.method = paymentMethod(method.method);
                })
            }
            category = 'día';
            summary.open = formatDateWithHours(summary.init_date.init);
            summary.init_date.init = formatDate(summary.init_date.init);
            if(summary.finish_date) summary.close = formatDateWithHours(summary.finish_date.end);
        }

        if(summary.products){
            let total = 0;
            summary.products.forEach(prod =>{
                const profit = Number(prod.product.sellingPrice * prod.quantity) - Number(prod.product.costPrice * prod.quantity)
                prod.profit = profit.toFixed(2);
                total  += Number(prod.profit);
            })
            summary.totalProfits = total.toFixed(2);
        }
        
        if(summary.utilityExpenses.length > 0){
            let gastos = 0;
            summary.utilityExpenses.forEach(expense =>{
                gastos += Number(expense.amount)
            })
            const totalProfit = Number(summary.totalProfits) - gastos;
            
            summary.totalProfitWithCost = totalProfit.toFixed(2);
        }
        let admin;
        if(user.role === 'admin') admin = true;
        const btnInicio = true;
        summary.products.sort((a, b) => b.quantity - a.quantity);
        res.render('showsummary', {user, summary, admin, btnInicio, category, mes});
    } catch (error) {
        next(error);
    }
}

const allProducts = async(req, res, next)=>{
    try {
        const user = req.user;
        let admin;
        if(user.role === 'admin') admin = true;
        const btnInicio = true;
        const products = await ProductManager.getSearch();
        res.render('allproducts', {user, btnInicio, admin, products});
    } catch (error) {
        next(error);
    }
}

export default { login, home, register, panelOption, showProd, getOrders, showOrder, showUser, getAllSummary, showSummary, allProducts }; 