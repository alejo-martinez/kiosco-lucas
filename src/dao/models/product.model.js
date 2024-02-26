import mongoose from "mongoose";

const collection = 'products';

const schema = new mongoose.Schema({
    title: {String, required: true},
    stock: {type: Number, required: true},
    price: { type: Number ,required: true },
});

export const productModel = mongoose.model(collection, schema);