import { createHash } from "../../utils.js";
import { getUserModel } from "../models/factory.js";


export default class UserManager {
    constructor(connection) {
        this.User = getUserModel(connection);
    }
    async getAll() {
        return await this.User.find().lean();
    }

    async getById(id) {
        return await this.User.findById(id).lean();
    }

    async getBy(key, value) {
        return await this.User.findOne({ [key]: value }).lean();
    }

    async getWithPassword(username) {
        return await this.User.findOne({ user_name: username }).select('+password');
    }

    async create(user) {
        await this.User.create(user);
    }

    async update(id, key, value) {
        if (key === 'password') {
            await this.User.updateOne({ _id: id }, { $set: { [key]: createHash(value) } });
        } else {
            await this.User.updateOne({ _id: id }, { $set: { [key]: value } });
        }
    }

    async delete(id) {
        await this.User.deleteOne({ _id: id });
    }

}