import config from "../config/config.js";
import jwt from 'jsonwebtoken';
import { cookieExtractor } from "../utils.js";
import UserManager from "../dao/service/user.service.js";
import CustomError from "../errors/custom.error.js";

export const authToken = (req, res, next) => {
    const token = cookieExtractor(req);
    if (!token) {

        req.user = undefined;
        return next();
    }
    else {
        jwt.verify(token, config.jwtSecret, (error, credentials) => {
            if (error) {

                return res.status(403).send({ status: 'error', error: 'Sesión expirada, vuelva a iniciar sesión' })
            }
            else {
                req.user = credentials.userId;
                next()
            }
        });
    }
}

export const adminUser = async (req, res, next) => {
    const admin = 'admin';
    try {
        const userManager = new UserManager(req.db);
        const user = await userManager.getById(req.user);
        if (user && user.role === admin) next();
        else throw new CustomError('Unauthorized', 'No tienes los permisos para realizar esta acción', 3);
        // throw new Error( 'No tienes los permisos para realizar esta acción');
    } catch (error) {
        next(error);
    }
};

export const godUser = async (req, res, next) => {
    const god = 'god';
    try {
        const userManager = new UserManager(req.db);
        const user = await userManager.getById(req.user);
        if (user && user.role === god) next();
        else throw new CustomError('Unauthorized', 'No tienes los permisos para realizar esta acción', 3);
        // throw new Error( 'No tienes los permisos para realizar esta acción');
    } catch (error) {
        next(error);
    }
}