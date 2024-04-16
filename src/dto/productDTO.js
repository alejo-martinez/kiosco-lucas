import { calculateSellingPrice } from "../utils.js";

export default class ProductDTO{
    constructor(title, costPrice, stock, totalStock, code, percentage, sellingPrice){
        this.title = title;
        this.costPrice = costPrice;
        this.sellingPrice = sellingPrice ? sellingPrice : calculateSellingPrice(percentage, costPrice);
        this.percentage = percentage;
        this.stock = stock;
        this.totalStock = totalStock;
        this.code = code;
    }
}