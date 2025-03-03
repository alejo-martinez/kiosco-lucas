import { generateToken } from "../utils.js";


const login = async (req, res, next) => {
    try {
        const user = req.user;
        const accesToken = generateToken(user);
        return res.cookie('accesToken', accesToken, { maxAge: 6 * 60 * 60 * 8000, signed: true, httpOnly: true, secure: true, sameSite: 'None', domain:'.vercel.app' }).send({ status: 'success', message: 'Logueado !', payload: user });
    } catch (error) {
        next(error);
    }
}

const register = async (req, res, next) => {
    try {
        return res.status(200).send({ status: 'success', message: 'Registrado !' });
    } catch (error) {
        next(error);
    }
}

const current = async (req, res, next) => {
    try {
        const user = req.user;
        return res.status(200).send({ status: 'success', payload: user });
    } catch (error) {
        next(error);
    }
}

const logOut = async (req, res, next) => {
    try {
        req.session.destroy(error => {
            if (error) {
                // res.send({ status: 'error', message: 'No pudimos cerrar la sesion: ' + error });
                return next(error);
            }
                res.clearCookie('accesToken', { domain: '.vercel.app'}).send({ status: 'success', message: 'Sesión cerrada con éxito !' })
        })
    } catch (error) {
        next(error);
    }
}

export default { login, register, current, logOut };