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

const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);