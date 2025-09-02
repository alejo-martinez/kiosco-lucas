
import { getExpenseModel } from "../models/factory.js";

export default class ExpenseService {
    constructor(connection) {
        this.Expense = getExpenseModel(connection);
    }
    async createExpense(expense, session) {
        return await this.Expense.create([expense], { session });
    }
}