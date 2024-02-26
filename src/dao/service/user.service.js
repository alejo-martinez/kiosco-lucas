import { userModel } from "../models/user.model.js";

export default class UserManager{
    static async getAll(){
        return await userModel.find().lean();
    }

    static async getById(id){
        return await userModel.findById(id).lean();
    }

    static async getBy(key, value){
        return await userModel.findOne({[key]:value}).lean();
    }

    static async getWithPassword(username){
        return await userModel.findOne({user_name: username}).select('+password');
    }

    static async create(user){
        await userModel.create(user);
    }

    static async update(id, key, value){
        await userModel.updateOne({_id: id}, {$set: {[key]: value}});
    }

    static async delete(id){
        await userModel.deleteOne({_id: id});
    }

}