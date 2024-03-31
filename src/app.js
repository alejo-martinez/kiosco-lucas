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

const app = express();

const httpServer = app.listen(parseInt(config.port), () => console.log(`Listening on port ${config.port}`));

const io = new Server(httpServer);

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
app.use(cors());

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
app.use('/', viewsRouter);

app.engine('handlebars', handlebars.engine());

app.set('views', __dirname + '/views');
app.set('view engine', 'handlebars');

io.on('connection', async (socket) => {
    socket.on('search', async (data) => {
        try {
            const prod = await ProductManager.getBy('code', Number(data.query));
            const totalPrice = Number(prod.sellingPrice);
            const cart = await CartManager.addProduct(data.cid, prod._id, 1, totalPrice, prod.stock);
            let total = 0;
            cart.products.forEach(prod=> total += prod.totalPrice);
            io.emit('updatedCart', {cart:cart, total:total});
            
        } catch (error) {
            socket.emit('errorUpdate', {error: error.message})
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

    socket.on('addToCart', async (data) => {
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