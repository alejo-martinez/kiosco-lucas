import productController from "../controllers/product.controller.js";
import { Router } from "express";
import { authToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get('/', authToken, productController.getAll);
router.get('/lowstock', authToken, productController.getLowStockProducts);
router.get('/filter', authToken, productController.getProductQuery);
router.get('/:pid', authToken, productController.getProductById);
router.post('/create', authToken, productController.createProduct);
router.put('/update/:pid', authToken, productController.updateProduct);
router.put('/full/:pid', authToken, productController.updateAllProduct);
router.delete('/delete/:pid', authToken, productController.deleteProduct);

export default router;