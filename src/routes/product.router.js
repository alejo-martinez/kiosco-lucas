import productController from "../controllers/product.controller.js";
import { Router } from "express";

const router = Router();

router.get('/filter', productController.getProductQuery);
router.get('/:pid', productController.getProductById);
router.post('/create', productController.createProduct);
router.put('/update/:pid', productController.updateProduct);
router.put('/full/:pid', productController.updateAllProduct);

export default router;