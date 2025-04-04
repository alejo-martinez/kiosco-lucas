import config from "../config/config.js";
import jwt from 'jsonwebtoken';
import { cookieExtractor } from "../utils.js";
import UserManager from "../dao/service/user.service.js";

export const authToken = (req, res, next) => {
    const token = cookieExtractor(req);
    if (!token) {
        
        req.user = undefined;
        return next();
    }
    else {
        jwt.verify(token, config.jwtSecret, (error, credentials) => {
            if (error){
                
                return res.status(403).send({status:'error', error: 'Sesión expirada, vuelva a iniciar sesión' })
            }
            else {
                req.user = credentials.userId;
                next()
            }
        });
    }
}

export const adminUser = async(req, res, next) =>{
    const admin = 'admin';
    try {
        
        const user = await UserManager.getById(req.user);
        if(user && user.role === admin) next();
        else res.render('error', {error: 'No tienes los permisos para ver esta página.'}) 
        // throw new Error( 'No tienes los permisos para realizar esta acción');
    } catch (error) {
        next(error);
    }
};