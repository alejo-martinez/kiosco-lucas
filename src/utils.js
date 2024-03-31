import {fileURLToPath} from 'url';
import { dirname } from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from './config/config.js';

export const cookieExtractor = (req) =>{
    let token=null;
    if(req && req.signedCookies){
        token = req.signedCookies['accesToken']
    }
    return token;
}

export const formatDate = (date)=> {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
};

export const generateToken = (user) => {
    const token = jwt.sign({ user }, config.jwtSecret, { expiresIn: '24h' });
    return token;
}

export const createHash = (password) => bcrypt.hashSync(password, bcrypt.genSaltSync(10));

export const isValidPassword = (user, password) => {
    return bcrypt.compareSync(password, user.password);
}

export const calculateSellingPrice = (percentage, costPrice) =>{
    const result =  costPrice * (1 + percentage / 100);
    return Number.isInteger(result) ? result.toFixed(2) : result;
}

const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

export const returnMonth = (month)=>{
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[month];
}