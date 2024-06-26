import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';

const collection = 'tickets';

const schema = new mongoose.Schema({
    products: [{product: {title: String, sellingPrice: Number, id: String, costPrice: Number, code: Number}, quantity: Number, totalPrice: Number}],
    amount: {type: Number},
    created_at: Date,
    seller: {type: mongoose.Schema.Types.ObjectId, ref: 'users'},
    payment_method: {type: String, enum: ['eft', 'mp', 'td', 'tc']}
});

schema.plugin(mongoosePaginate);

export const ticketModel = mongoose.model(collection, schema);