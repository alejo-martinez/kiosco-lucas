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

import config from "./config/config.js";

const app = express();

const httpServer = app.listen(parseInt(config.port), ()=> console.log(`Listening on port ${config.port}`));

app.use(session({
    store:MongoStore.create({
        mongoUrl: config.databaseURL,
        ttl: 20
    }),
    secret: config.secretKey,
    resave: false,
    saveUninitialized: false
}));

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

app.engine('handlebars', handlebars.engine());

app.set('views', __dirname + '/views');
app.set('view engine', 'handlebars');

mongoose.connect(config.databaseURL);