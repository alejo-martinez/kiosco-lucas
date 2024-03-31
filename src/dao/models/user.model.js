import mongoose from "mongoose";

const collection = 'users';

const schema = new mongoose.Schema({
    name: { type: String, required: true},
    user_name: {type: String, required: true, unique: true},
    password: { type: String, required: true, select: false},
    role: {type: String, default:'vendedor'},
    cart: {type: mongoose.Schema.Types.ObjectId, ref: 'carts'}
});

export const userModel = mongoose.model(collection, schema);