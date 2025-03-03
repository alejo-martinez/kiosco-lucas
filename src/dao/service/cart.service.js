import CustomError from "../../errors/custom.error.js";
import { cartModel } from "../models/cart.model.js";

export default class CartManager{
    static async createCart(arr){
       return await cartModel.create(arr);
    }

    static async addProduct(cid, pid, quantity, totalPrice, stock){
        const cart = await cartModel.findOne({_id: cid});
        const prodAdded = cart.products.find(prod => prod.product.equals(pid));
        if(prodAdded){
            if(parseInt(prodAdded.quantity) + parseInt(quantity) > stock) throw new CustomError('Limit stock', 'Límite de stock alcanzado', 6);
            prodAdded.quantity += Number(quantity);
            prodAdded.totalPrice += totalPrice.toFixed(2);
            await cartModel.updateOne({_id: cid, 'products.product': pid}, {$inc:{'products.$.quantity':Number(quantity), 'products.$.totalPrice': totalPrice}})
            return await cartModel.findById(cid).populate('products.product').lean();
        }else{
            await cartModel.findOneAndUpdate({_id: cid}, {$push:{products:{product:pid, quantity: quantity, totalPrice: totalPrice.toFixed(2)}}})
            return await cartModel.findById(cid).populate('products.product').lean(); 
        }
    }

    static async getCartById(id){
        return await cartModel.findById(id).populate('products.product').lean();
    }

    static async removeProduct(cid, pid){
        await cartModel.updateOne({_id: cid}, {$pull: {products: { product : pid}}});
        return await cartModel.findOne( { _id : cid} ).populate("products.product");  
    }

    static async emptyCart(cid){
        return await cartModel.findOneAndUpdate({_id: cid}, {$set: { products: [] } }, {new:true});
    }
}