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

export const generateToken = (user) => {
    const token = jwt.sign({ user }, config.jwtSecret, { expiresIn: '24h' });
    return token;
}

export const createHash = (password) => bcrypt.hashSync(password, bcrypt.genSaltSync(10));

export const isValidPassword = (user, password) => {
    return bcrypt.compareSync(password, user.password);
}

const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);