import express from "express";
import mongoose from "mongoose";
import cors from 'cors';
import handlebars from 'express-handlebars';
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import MongoStore from "connect-mongo";
import { Server } from "socket.io";
import path from 'path';


import { __dirname } from "./utils.js";

import sessionRouter from './routes/session.router.js';
import viewsRouter from './routes/views.router.js';
import productRouter from './routes/product.router.js';
import cartRouter from './routes/cart.router.js';
import ticketRouter from './routes/ticket.router.js';
import userRouter from './routes/user.router.js';
import resumeRouter from './routes/resume.router.js';

import config from "./config/config.js";

import initPassport from './config/passport.config.js';
import ProductManager from "./dao/service/product.service.js";

import handleErrors from './middlewares/error.middleware.js';
import CartManager from "./dao/service/cart.service.js";
import CustomError from "./errors/custom.error.js";

const app = express();

const httpServer = app.listen(parseInt(config.port), () => console.log(`Listening on port ${config.port}`));

const io = new Server(httpServer, {
    cors:{
        origin:config.urlFront,
        methods:['GET', 'POST'],
        credentials:true
    }
});

app.use(session({
    store: MongoStore.create({
        mongoUrl: config.databaseURL,
        ttl: 20
    }),
    secret: config.secretKey,
    resave: false,
    saveUninitialized: false
}));

initPassport();

app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser(config.cookieCode));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({origin:config.urlFront, credentials:true}));

app.use('/static', express.static(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(__dirname + '/public'));

//RUTAS
app.use('/api/session', sessionRouter);
app.use('/api/products', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/ticket', ticketRouter);
app.use('/api/user', userRouter);
app.use('/api/resume', resumeRouter);
// app.use('/', viewsRouter);

app.engine('handlebars', handlebars.engine());

app.set('views', __dirname + '/views');
app.set('view engine', 'handlebars');

io.on('connection', async (socket) => {

    socket.on('searchCodeUpdate', async(data)=>{
        try {

            const prod = await ProductManager.getBy('code', Number(data.code));
            if(!prod) throw new CustomError('No data', 'No se encontró un producto', 4);
            io.emit('resultCodeUpdate', {producto: prod});
        } catch (error) {
            io.emit('errorCodeUpdate', {error: error.message})
        }
    })

    socket.on('searchCode', async(data)=>{
        try {
            const prod = await ProductManager.getBy('code', Number(data.query));
            console.log(prod)
            io.emit('resultCode', {producto: prod});
        } catch (error) {
            io.emit('errorCode', {error: error.message})
        }

    })

    socket.on('search', async (data) => {
        try {
            const prod = await ProductManager.getBy('code', Number(data.query));
            if(!prod) throw new CustomError('No data', 'El producto no existe', 4);
            
            if(prod.stock <= 0) throw new CustomError('No stock', 'Producto sin stock', 4);
            const carrito = await CartManager.getCartById(data.cid);

            const finded = carrito.products.find(p => p.product._id.equals(prod._id) );

            if((finded && ((Number(finded.quantity) + Number(data.quantity) > prod.stock))) || (Number(data.quantity) > prod.stock)) throw new CustomError('No stock', 'Alcanzaste el máximo de stock de este producto', 6)
            const totalPrice = Number(prod.sellingPrice) * Number(data.quantity);
            const cart = await CartManager.addProduct(data.cid, prod._id, data.quantity, totalPrice, prod.stock);
            let total = 0;
            cart.products.forEach(prod=>{
                total += Number(prod.totalPrice);
            });
            total = Number(total).toFixed(2);
            io.emit('updatedCart', {cart:cart, total:total});
            
        } catch (error) {
            socket.emit('errorUpdate', {error: error.message})
        }
    })

    socket.on('searchByCode', async(data)=>{
        try {
            const prod = await  ProductManager.getBy('code',  Number(data.code));
            if(!prod) throw new CustomError('No data', 'El producto no existe', 4);
            io.emit('resultTitle', {results: [prod]});
        } catch (error) {
            socket.emit('errorUpdate', {error: error.message});
        }
    })

    socket.on('searchTitle', async (data) => {
        
        const products = await ProductManager.getSearch();
        if (!data.query) io.emit('result', { empty: true });
        else {
            const prodsFilter = products.filter((prod) => prod.title.toLowerCase().includes(data.query.toLowerCase()));
            io.emit('resultTitle', { results: prodsFilter });
        }
    })

    // socket.on('searchAndUpdate', async(data)=>{

    // })

    socket.on('addToCart', async (data) => {
        console.log(data)
        try {
            const producto = await ProductManager.getById(data.pid);
            const totalPrice = producto.sellingPrice * data.quantity;
            const cart = await CartManager.addProduct(data.cid, data.pid, data.quantity, totalPrice);
            let total = 0;
            cart.products.forEach(prod => total += prod.totalPrice);
            io.emit('updatedCart', { cart: cart, total: total });
        } catch (error) {
            console.log(error);
            socket.emit('errorUpdate', error)
        }
    })

    socket.on('remove', async (data) => {
        try {
            const cartUpdated = await CartManager.removeProduct(data.cid, data.pid);
            let total = 0;
            cartUpdated.products.forEach(prod => total += prod.totalPrice);
            io.emit('removeSuccess', { cart: cartUpdated, total: total });
        } catch (error) {

            socket.emit('removeError', error);
        }
    })
})

mongoose.connect(config.databaseURL);

app.use(handleErrors)
export {io}