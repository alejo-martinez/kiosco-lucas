import { cartModel } from "../models/cart.model.js";

export default class CartManager{
    static async create(){
        return await cartModel.create();
    }
}