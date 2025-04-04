import cartController from "../controllers/cart.controller.js";
import { Router } from "express";
import { authToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get('/:cid', authToken, cartController.getCart);
router.post('/create', authToken, cartController.createCart);
router.put('/remove/prod/:cid', authToken, cartController.removeProductById);
router.delete('/empty/:cid', authToken, cartController.emptyCart);

export default router;