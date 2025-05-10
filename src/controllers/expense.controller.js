import ExpenseService from "../dao/service/expense.service.js";
import CustomError from "../errors/custom.error.js";
import ResumeManager from "../dao/service/resume.service.js";
import ExpenseDTO from "../dto/expenseDTO.js";
import ProductManager from "../dao/service/product.service.js";

const createExpense = async(req, res, next)=>{
    try {
        const {productId, quantity, resumeId} = req.body;
        if(!productId || productId.length === 0 || !quantity) throw new CustomError('Missing Data', 'Campos incompletos', 2);
        const prod = await ProductManager.getById(productId)
        const user = req.user;
        const date = new Date();
        const exp = new ExpenseDTO(productId, user, date, quantity);
        const newExpense = await ExpenseService.createExpense(exp);
        const newStock = Number(prod.stock) - 1;
        await ProductManager.update(productId, 'stock', newStock);
        await ResumeManager.addExpense(resumeId, {expense: newExpense._id});
        return res.status(200).send({status:'success', message:'Consumo agregado !'});
    } catch (error) {
        next(error);
    }
};

export default {
    createExpense
}