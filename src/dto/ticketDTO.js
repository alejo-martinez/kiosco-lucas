export class TicketDTO{
    constructor(products, amount, seller){
        this.products = products;
        this.amount = amount;
        this.seller = seller;
        this.created_at = new Date();
    }
}
