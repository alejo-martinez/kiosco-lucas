import passport from "passport";
import local from 'passport-local';
import jwt from 'passport-jwt';
import {cookieExtractor, isValidPassword} from "../utils.js";
import config from "./config.js";

import CartManager from "../dao/service/cart.service.js";
import UserManager from "../dao/service/user.service.js";
import UserDTO from "../dto/userDTO.js";


const JWTstrategy = jwt.Strategy;
const localStrategy = local.Strategy;

const ExtractJwt = jwt.ExtractJwt;

const initPassport = ()=> {
    passport.use('jwt', new JWTstrategy({
        jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
        secretOrKey: config.jwtSecret
    }, async(jwt_payload, done)=>{
        try {
            return done(null, jwt_payload.user)
        } catch (error) {
            done(error)
        }
    }))

    passport.use('register', new localStrategy({
        passReqToCallback: true, usernameField: 'user_name'
    }, async(req, username, passport, done)=>{
        const {name, user_name, password, role} = req.body;
        try {
            if(!name || !user_name || !password) return done(null, false, {message:'Debes completar los campos obligatorios'});
            const user = await UserManager.getBy('user_name', user_name);
            if(user){
                return done(null, false, {message:'Error, nombre de usuario en uso. Usá uno distinto.'});
            } 
            else {
                const cart = await CartManager.create();
                const usuario = new UserDTO(name, user_name, password, role);
                usuario.cart = cart._id;
                await UserManager.create(usuario);
                return done(null, usuario);
            }
        } catch (error) {
            return done('Error al hacer el registro: ' + error)
        }
    }))

    passport.use('login', new localStrategy({
        passReqToCallback: true, usernameField:'user_name'
    }, async(req, username, pass, done)=>{
        try {
            const {password} = req.body;
            const user = await UserManager.getWithPassword(username);
            if(!password || !username) done(null, false, {message:'Debes completar todos los campos'});
            if(!user || !isValidPassword(user, password)) done(null, false, {message: 'Nombre de usuario o contraseña incorrecta'});
            else{
                const usuario = await UserManager.getBy('user_name', username);
                done(null, usuario, {message:'Usuario logueado!'});
            } 
        } catch (error) {
            return done('Error al iniciar sesión: ' + error);
        }
    }))

    passport.serializeUser((user, done)=>{
        done(null, user._id);
    })

    passport.deserializeUser(async(id, done)=>{
        let usuario = await UserManager.getById(id);
        done(null, usuario);
    })
}

export default initPassport;