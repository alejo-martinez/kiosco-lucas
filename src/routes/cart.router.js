import cartController from "../controllers/cart.controller.js";
import { Router } from "express";

const router = Router();

router.get('/:cid', cartController.getCart);
router.post('/create', cartController.createCart);
router.put('/remove/prod/:cid', cartController.removeProductById);
router.delete('/empty/:cid', cartController.emptyCart);

export default router;