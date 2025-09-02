// import mongoose from 'mongoose';
// import mongoosePaginate from 'mongoose-paginate-v2';

// const collection = 'resume';

// const schema = new mongoose.Schema({
//     init_date: {init: {type: Date}, seller: {type: mongoose.Schema.Types.ObjectId, ref: 'users'}},
//     finish_date: {end: {type: Date}, seller: {type: mongoose.Schema.Types.ObjectId, ref: 'users'}},
//     amount: {type: Number, default: 0},
//     amount_per_method: [{method: String, amount: Number}],
//     products: {type: [{product: {title: String, sellingPrice: Number, id: String, costPrice: Number, code: Number}, quantity: Number, total: Number}], default: []},
//     category: {type: String, enum:['diary', 'monthly']},
//     initAmount: {type: Number},
//     month: {type: Number},
//     year: {type: Number},
//     sales: Number,
//     tickets: {type:[{ticket: {type: mongoose.Schema.Types.ObjectId, ref:'tickets'}}], default:[]},
//     expenses: {type:[{expense: {type: mongoose.Schema.Types.ObjectId, ref: 'expenses'}}], default:[]}
// });

// schema.index({ month: 1, year: 1 });

// schema.plugin(mongoosePaginate);

// // export const resumeModel = mongoose.model(collection, schema);