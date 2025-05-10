import mongoose from "mongoose";

const collection = 'expenses';

const schema = new mongoose.Schema({
        product: {type: mongoose.Schema.Types.ObjectId, ref: 'products'},
        quantity: Number,
        user: {type: mongoose.Schema.Types.ObjectId, ref: 'users'},
        created_at: Date
});

export const expenseModel = mongoose.model(collection, schema);