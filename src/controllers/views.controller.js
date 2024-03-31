import CartManager from "../dao/service/cart.service.js";
import ProductManager from "../dao/service/product.service.js";
import ResumeManager from "../dao/service/resume.service.js";
import { TicketManager } from "../dao/service/ticket.service.js";
import UserManager from "../dao/service/user.service.js";
import { formatDate } from "../utils.js";


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
            const date = new Date().setHours(0, 0, 0, 0);
            const summary = await ResumeManager.getTodayResume(date);
            const carrito = await CartManager.getCartById(user.cart._id);
            let total = 0;
            carrito.products.forEach(prod => {
                prod.totalPrice = (Number(prod.product.sellingPrice) * Number(prod.quantity));
                total += Number.isInteger(prod.totalPrice) ? Number(prod.totalPrice.toFixed(2)) : Number(prod.totalPrice);
            });
            total = Number.isInteger(total) ? total.toFixed(2) : total;
            let admin;
            if (user.role === 'admin') {
                admin = true;
                res.render('home', { user, admin, carrito, total, summary });
            }
            else {
                res.render('home', { user, carrito, total, summary })
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
        // if (!user) res.redirect('/login');
        // else {
        const admin = true;
        const btnInicio = true;
        const producto = await ProductManager.getById(pid);
        res.render('showprod', { producto, user, admin, btnInicio })
        // }
    } catch (error) {
        next(error);
    }
}

const panelAdmin = (req, res, next) => {
    try {
        const btnInicio = true;
        const user = req.user;
        // if (!user) res.redirect('/login');
        // else {
        res.render('panel', { user, btnInicio })
        // }
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
        // if (!user) res.redirect('/login');
        // else {
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
        // }
    } catch (error) {
        next(error);
    }
}

const getOrders = async (req, res, next) => {
    try {
        const user = req.user;
        // if (!user) res.redirect('/login');
        // else {
        const btnInicio = true;
        const admin = true;
        const { page = 1 } = req.query;
        const response = await TicketManager.getAll(page);
        const tickets = response.docs;
        tickets.forEach(ticket => {
            ticket.created_at = formatDate(ticket.created_at);
        })
        res.render('orders', { user, admin, page, btnInicio, orders: tickets, nextPage: response.nextPage, prevPage: response.prevPage, hasNextPage: response.hasNextPage, hasPrevPage: response.hasPrevPage });
        // }
    } catch (error) {
        next(error);
    }
}

const showOrder = async (req, res, next) => {
    try {
        const user = req.user;
        const { tid } = req.params;
        // if (!user) res.redirect('/login');
        // else {
        const admin = true;
        const btnInicio = true;
        const ticket = await TicketManager.getById(tid);
        console.log(ticket)
        if (!ticket) throw new CustomError('No Data', 'No existe la orden solicitada', 4);
        ticket.created_at = formatDate(ticket.created_at);
        res.render("showorder", { admin, user, ticket, btnInicio });
        // }
    } catch (error) {
        next(error);
    }
}

const showUser = async (req, res, next) => {
    try {
        const { uid } = req.params;
        const user = req.user;
        // if (!user) res.redirect('/login');
        // else {
        const admin = true;
        const btnInicio = true;
        const usuario = await UserManager.getById(uid);
        res.render('showuser', { user, admin, btnInicio, usuario });
        // }
    } catch (error) {
        next(error);
    }
}

const testPage = (req, res, next) => {
    try {
        res.render('test')
    } catch (error) {
        next(error);
    }
}

const monthlySummary = (req, res, next) => {
    try {

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
        // console.log(data)
        const btnInicio = true;
        const admin = true;
        if (!data) res.render('summaries', {btnInicio, admin, user})
        else {
            const summaries = data.docs;
            const nextPage = data.nextPage;
            const prevPage = data.prevPage;
            const hasNextPage = data.hasNextPage;
            const hasPrevPage = data.hasPrevPage;
            const category = `${cat === 'daily' ? 'diarios' : 'mensuales'}`
            res.render('summaries', { btnInicio, admin, user, summaries, nextPage, prevPage, hasNextPage, hasPrevPage, category, page });
        }
    } catch (error) {
        console.log(error)
        next(error);
    }
}

const showSummary = async(req, res, next) => {
    try {
        const {sid} = req.params;
        const user = req.user;
        const summary = await ResumeManager.getResumeById(sid);
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const prodsOrdened = [];
        summary.orders.forEach(order=>{
            order.order.products.forEach(prod=>{
                const producto = prodsOrdened.find(produ => produ._id === prod.product._id);
                if(producto){
                    producto.quantity += prod.quantity;
                    producto.total += prod.totalPrice;
                    prodsOrdened.filter(produc => produc._id === prod._id);
                    prodsOrdened.push(producto);
                }
                else{
                    prodsOrdened.push({
                        _id: prod.product._id,
                        quantity: Number(prod.quantity),
                        total: Number(prod.totalPrice)
                    })
                }
            })
        })
        console.log(prodsOrdened)
        let category;
        let mes;
        if(summary.category === 'monthly'){
            category = 'mes';
            mes = months[Number(summary.month) - 1];
        }
        if(summary.category === 'diary') category = 'día';
        if(summary.date) summary.date = formatDate(summary.date);
        const admin = true;
        const btnInicio = true;
        res.render('showsummary', {user, summary, admin, btnInicio, category, mes});
    } catch (error) {
        next(error);
    }
}

export default { login, home, register, panelAdmin, panelOption, showProd, getOrders, showOrder, showUser, testPage, getAllSummary, showSummary }; 