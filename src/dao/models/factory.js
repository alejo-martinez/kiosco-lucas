import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2'

const productCollection = 'products';
const expenseCollection = 'expenses';
const resumeCollection = 'resume';
const ticketCollection = 'tickets';
const userCollection = 'users';
const cartCollection = 'carts';

const productSchema = new mongoose.Schema({
    title: { type: String, index: true },
    stock: { type: Number },
    totalStock: { type: Number },
    costPrice: { type: Number },
    percentage: { type: Number },
    sellingPrice: { type: Number },
    code: { type: Number, index: true }
});


const cartSchema = new mongoose.Schema({
    products: {
        type:
            [
                { product: { type: mongoose.Schema.Types.ObjectId, ref: 'products' }, quantity: Number, totalPrice: Number }
            ],
        default: []
    },
});

const expenseSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'products' },
    quantity: Number,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    created_at: Date
});


const resumeSchema = new mongoose.Schema({
    init_date: { init: { type: Date }, seller: { type: mongoose.Schema.Types.ObjectId, ref: 'users' } },
    finish_date: { end: { type: Date }, seller: { type: mongoose.Schema.Types.ObjectId, ref: 'users' } },
    amount: { type: Number, default: 0 },
    amount_per_method: [{ method: String, amount: Number }],
    products: { type: [{ product: { title: String, sellingPrice: Number, id: String, costPrice: Number, code: Number }, quantity: Number, total: Number }], default: [] },
    category: { type: String, enum: ['diary', 'monthly'] },
    initAmount: { type: Number },
    month: { type: Number },
    year: { type: Number },
    sales: Number,
    tickets: { type: [{ ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'tickets' } }], default: [] },
    expenses: { type: [{ expense: { type: mongoose.Schema.Types.ObjectId, ref: 'expenses' } }], default: [] }
});

const ticketSchema = new mongoose.Schema({
    products: [{ product: { title: String, sellingPrice: Number, id: String, costPrice: Number, code: Number }, quantity: Number, totalPrice: Number }],
    amount: { type: Number },
    created_at: Date,
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    payment_method: { type: String, enum: ['eft', 'mp', 'td', 'tc'] }
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    user_name: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, default: 'vendedor' },
    cart: { type: mongoose.Schema.Types.ObjectId, ref: 'carts' }
});

productSchema.plugin(mongoosePaginate);
resumeSchema.plugin(mongoosePaginate);
ticketSchema.plugin(mongoosePaginate);

resumeSchema.index({ month: 1, year: 1 });

export const getProductModel = (conn) => {
    return conn.models.Product || conn.model(productCollection, productSchema);
}
export const getExpenseModel = (conn) => {
    return conn.models.Expense || conn.model(expenseCollection, expenseSchema);
}
export const getResumeModel = (conn) => {
    return conn.models.Resume || conn.model(resumeCollection, resumeSchema);
}
export const getTicketModel = (conn) => {
    return conn.models.Ticket || conn.model(ticketCollection, ticketSchema);
}
export const getUserModel = (conn) => {
    return conn.models.User || conn.model(userCollection, userSchema);
}
export const getCartModel = (conn) => {
    return conn.models.Cart || conn.model(cartCollection, cartSchema);
}