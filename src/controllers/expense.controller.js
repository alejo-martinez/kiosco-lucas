import ExpenseService from "../dao/service/expense.service.js";
import CustomError from "../errors/custom.error.js";
import ResumeManager from "../dao/service/resume.service.js";
import ExpenseDTO from "../dto/expenseDTO.js";
import ProductManager from "../dao/service/product.service.js";
import mongoose from "mongoose";

const createExpense = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId, quantity, resumeId } = req.body;
    if (!productId || productId.length === 0 || !quantity) {
      throw new CustomError('Missing Data', 'Campos incompletos', 2);
    }
    const productManager = new ProductManager(req.db);
    const prod = await productManager.getById(productId, null, session);
    if (!prod) throw new CustomError('Not Found', 'Producto no encontrado', 4);

    const user = req.user;
    const date = new Date();
    const exp = new ExpenseDTO(productId, user, date, quantity);
    const expenseService = new ExpenseService(req.db);
    const newExpense = await expenseService.createExpense(exp, session);

    const newStock = Number(prod.stock) - Number(quantity);
    if (newStock < 0) throw new CustomError('Stock Error', 'Stock insuficiente', 5);
    const resumeManager = new ResumeManager(req.db);
    await productManager.update(productId, { stock: newStock }, session);

    await resumeManager.addExpense(resumeId, { expense: newExpense._id }, session);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).send({ status: 'success', message: 'Consumo agregado !' });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).send({ status: 'error', message: err.message || 'Error interno' });
  }
};

export default {
  createExpense
}