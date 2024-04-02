import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const collection = 'resume';

const schema = new mongoose.Schema({
    init_date: {type: Date},
    finish_date: {type: Date},
    amount: {type: Number, default: 0},
    products: {type:[{product: {type: mongoose.Schema.Types.ObjectId, ref: 'products'}, quantity: Number, total: Number}], default: []},
    category: {type: String, enum:['diary', 'monthly']},
    initAmount: {type: Number},
    month: {type: Number},
    year: {type: Number},
    utilityExpenses: {type:[{expense: String, amount: Number}], default: []},
    sales: Number
});

schema.plugin(mongoosePaginate);

export const resumeModel = mongoose.model(collection, schema);