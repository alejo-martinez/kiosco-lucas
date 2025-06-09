import { expenseModel } from "../models/expenses.model.js";

export default class ExpenseService {
    static async createExpense(expense, session){
        return await expenseModel.create([expense], {session});
    }
}