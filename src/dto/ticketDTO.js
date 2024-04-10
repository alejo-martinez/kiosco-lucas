export class TicketDTO{
    constructor(products, amount, seller, payment_method){
        this.products = products;
        this.amount = amount;
        this.seller = seller;
        this.created_at = new Date();
        this.payment_method = payment_method;
    }
}
