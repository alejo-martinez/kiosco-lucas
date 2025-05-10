
export default class ExpenseDTO{
    constructor(productId, userId, created_at, quantity){
        this.product = productId;
        this.user = userId;
        this.quantity = quantity;
        this.created_at = created_at;
    }
}