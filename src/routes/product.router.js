import productController from "../controllers/product.controller.js";
import { Router } from "express";

const router = Router();

router.get('/filter', productController.getProductQuery);
router.post('/create', productController.createProduct);
router.put('/update/:pid', productController.updateProduct);

export default router;