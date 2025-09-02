import CustomError from "../../errors/custom.error.js";

import { getCartModel, getProductModel } from "../models/factory.js";

export default class CartManager {
    constructor(connection) {
        this.Cart = getCartModel(connection);
        this.Product = getProductModel(connection);
    }
    async createCart(arr) {
        return await this.Cart.create(arr);
    }

    async addProduct(cid, pid, quantity, totalPrice, stock) {
        const cart = await this.Cart.findOne({ _id: cid });
        const prodAdded = cart.products.find(prod => prod.product.equals(pid));
        if (prodAdded) {
            if (parseInt(prodAdded.quantity) + parseInt(quantity) > stock) throw new CustomError('Limit stock', 'Límite de stock alcanzado', 6);
            prodAdded.quantity += Number(quantity);
            prodAdded.totalPrice += totalPrice.toFixed(2);
            await this.Cart.updateOne({ _id: cid, 'products.product': pid }, { $inc: { 'products.$.quantity': Number(quantity), 'products.$.totalPrice': totalPrice } })
            return await this.Cart.findById(cid).populate({ path: 'products.product', model: this.Product }).lean();
        } else {
            await this.Cart.findOneAndUpdate({ _id: cid }, { $push: { products: { product: pid, quantity: quantity, totalPrice: totalPrice.toFixed(2) } } })
            return await this.Cart.findById(cid).populate({ path: 'products.product', model: this.Product }).lean();
        }
    }

    async getCartById(id) {
        return await this.Cart.findById(id).populate({ path: 'products.product', model: this.Product }).lean();
    }

    async removeProduct(cid, pid) {
        await this.Cart.updateOne({ _id: cid }, { $pull: { products: { product: pid } } });
        return await this.Cart.findOne({ _id: cid }).populate({ path: "products.product", model: this.Product });
    }

    async emptyCart(cid, session = null) {
        return await this.Cart.findOneAndUpdate({ _id: cid }, { $set: { products: [] } }, { new: true, session });
    }

    async update(cid, update = {}, session = null) {
        return await this.Cart.findOneAndUpdate({ _id: cid }, update, { new: true, session });
    }
}