import UserManager from "../dao/service/user.service.js";
import CustomError from "../errors/custom.error.js";

const updateUser = async(req, res, next)=>{
    try {
        const {uid} = req.params;
        const {field, value} = req.body;
        if(!value) throw new CustomError('Missing arguments', 'Proporciona un valor para actualizar', 2);
        await UserManager.update(uid, field, value);
        return res.status(200).send({status: 'success', message: 'Usuario actualizado!'})
    } catch (error) {
        next(error);
    }
}

export default {updateUser};