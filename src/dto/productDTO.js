import { calculateSellingPrice } from "../utils.js";

export default class ProductDTO{
    constructor(title, price, stock, totalStock, code, percentage){
        this.title = title;
        this.costPrice = price;
        this.sellingPrice = calculateSellingPrice(percentage, price);
        this.percentage = percentage;
        this.stock = stock;
        this.totalStock = totalStock;
        this.code = code;
    }
}