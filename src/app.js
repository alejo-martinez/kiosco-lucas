import express from "express";

import cors from 'cors';

import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";

import { Server } from "socket.io";

import ProductManager from "./dao/service/product.service.js";
import CartManager from "./dao/service/cart.service.js";

import { __dirname } from "./utils.js";

import sessionRouter from './routes/session.router.js';
import CustomError from "./errors/custom.error.js";
import productRouter from './routes/product.router.js';
import cartRouter from './routes/cart.router.js';
import ticketRouter from './routes/ticket.router.js';
import userRouter from './routes/user.router.js';
import resumeRouter from './routes/resume.router.js';
import expenseRouter from './routes/expense.router.js';
import tenantRouter from './routes/tenant.router.js';

import config from "./config/config.js";

import initPassport from './config/passport.config.js';


import handleErrors from './middlewares/error.middleware.js';

import { getTenantConnection } from "./tenants/connManager.js";
import { tenantMiddleware } from "./middlewares/tenant.middleware.js";
import { RedisStore } from "connect-redis";
import redisClient from "./config/redis.config.js";

const app = express();

const httpServer = app.listen(parseInt(config.port), () => console.log(`Listening on port ${config.port}`));

const io = new Server(httpServer, {
    cors: {
        origin: [
            "http://localhost:3000",
            "https://kiosco-lucas-front.vercel.app",
            "https://kiosco-test.vercel.app"
        ],
        credentials: true
    }
});

io.use(async (socket, next) => {
    try {
        const tenantId = socket.handshake.headers["x-tenant-id"];
        if (!tenantId) return next(new Error("Tenant faltante"));


        // cargar conexión de Mongo para ese tenant
        const conn = await getTenantConnection(tenantId === 'localhost' ? 'kiosco-test' : tenantId);
        // console.log(conn)
        // guardamos en socket.data para futuros eventos
        socket.data.tenantId = tenantId;
        socket.data.db = conn;

        next();
    } catch (err) {
        next(err);
    }
});

app.use(session({
    store: new RedisStore({ client: redisClient, prefix: "sess:" }),
    secret: config.secretKey,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: config.nodeEnv === "production", // solo https en prod
        httpOnly: true,
        maxAge: 1000 * 60 * 60
    }
}))


initPassport();

app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser(config.cookieCode));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const allowed = (config.corsOrigins || "").split(",").map(s => s.trim());
app.use(cors({
    origin: (origin, cb) => {
        if (!origin) return cb(null, true); // permite requests tipo curl/postman
        if (allowed.some(a => origin.endsWith(a) || origin === a)) {
            return cb(null, true);
        }
        return cb(new Error("Not allowed by CORS"));
    },
    credentials: true
}));



//RUTAS
app.use('/api/session', tenantMiddleware, sessionRouter);
app.use('/api/products', tenantMiddleware, productRouter);
app.use('/api/cart', tenantMiddleware, cartRouter);
app.use('/api/ticket', tenantMiddleware, ticketRouter);
app.use('/api/user', tenantMiddleware, userRouter);
app.use('/api/resume', tenantMiddleware, resumeRouter);
app.use('/api/expense', tenantMiddleware, expenseRouter)
app.use('/api/tenants', tenantRouter);

io.on('connection', async (socket) => {

    socket.on('searchCodeUpdate', async (data) => {
        try {
            const prodManager = new ProductManager(socket.data.db)
            const prod = await prodManager.getBy('code', Number(data.code));
            if (!prod) throw new CustomError('No data', 'No se encontró un producto', 4);
            io.emit('resultCodeUpdate', { producto: prod });
        } catch (error) {
            io.emit('errorCodeUpdate', { error: error.message })
        }
    })

    socket.on('searchCode', async (data) => {
        try {
            const prodManager = new ProductManager(socket.data.db)
            const prod = await prodManager.getBy('code', Number(data.query));
            console.log(prod)
            io.to(data.socketId).emit('resultCode', { producto: prod });
        } catch (error) {
            io.emit('errorCode', { error: error.message })
        }

    })

    socket.on('search', async (data) => {
        try {
            const prodManager = new ProductManager(socket.data.db)
            const cartManager = new CartManager(socket.data.db);
            const prod = await prodManager.getBy('code', Number(data.query));
            if (!prod) throw new CustomError('No data', 'El producto no existe', 4);

            if (prod.stock <= 0) throw new CustomError('No stock', 'Producto sin stock', 4);
            const carrito = await cartManager.getCartById(data.cid);

            const finded = carrito.products.find(p => p.product._id.equals(prod._id));

            if ((finded && ((Number(finded.quantity) + Number(data.quantity) > prod.stock))) || (Number(data.quantity) > prod.stock)) throw new CustomError('No stock', 'Alcanzaste el máximo de stock de este producto', 6)
            const totalPrice = Number(prod.sellingPrice) * Number(data.quantity);
            const cart = await cartManager.addProduct(data.cid, prod._id, data.quantity, totalPrice, prod.stock);
            let total = 0;
            cart.products.forEach(prod => {
                total += Number(prod.totalPrice);
            });
            total = Number(total).toFixed(2);
            io.emit('updatedCart', { cart: cart, total: total });

        } catch (error) {
            socket.emit('errorUpdate', { error: error.message })
        }
    })

    socket.on('searchByCode', async (data) => {
        try {
            const prodManager = new ProductManager(socket.data.db)
            const prod = await prodManager.getBy('code', Number(data.code));
            if (!prod) throw new CustomError('No data', 'El producto no existe', 4);
            io.emit('resultTitle', { results: [prod] });
        } catch (error) {
            socket.emit('errorUpdate', { error: error.message });
        }
    })

    socket.on('searchTitle', async (data) => {
        const prodManager = new ProductManager(socket.data.db)
        const products = await prodManager.getSearch();
        if (!data.query) io.emit('resultTitle', { empty: true });
        else {
            const prodsFilter = products.filter((prod) => prod.title.toLowerCase().includes(data.query.toLowerCase()));
            io.to(data.socketId).emit('resultTitle', { results: prodsFilter });
        }
    })

    // socket.on('searchAndUpdate', async(data)=>{

    // })

    socket.on('addToCart', async (data) => {
        // console.log(data)
        try {
            const cartManager = new CartManager(socket.data.db);
            const prodManager = new ProductManager(socket.data.db)
            const producto = await prodManager.getById(data.pid);
            const totalPrice = producto.sellingPrice * data.quantity;
            const cart = await cartManager.addProduct(data.cid, data.pid, data.quantity, totalPrice);
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
            const cartManager = new CartManager(socket.data.db);
            const cartUpdated = await cartManager.removeProduct(data.cid, data.pid);
            let total = 0;
            cartUpdated.products.forEach(prod => total += prod.totalPrice);
            io.emit('removeSuccess', { cart: cartUpdated, total: total });
        } catch (error) {

            socket.emit('removeError', error);
        }
    })
})

// mongoose.connect(config.databaseURL);

app.use(handleErrors)
export { io }