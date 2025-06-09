import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2'

const collection = 'products';

const schema = new mongoose.Schema({
    title: {type: String, index: true},
    stock: {type: Number},
    totalStock: {type: Number},
    costPrice: {type: Number},
    percentage: {type: Number},
    sellingPrice: {type: Number},
    code: {type: Number, index: true}
});

schema.plugin(mongoosePaginate);

export const productModel = mongoose.model(collection, schema);