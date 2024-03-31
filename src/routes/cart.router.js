import cartController from "../controllers/cart.controller.js";
import { Router } from "express";

const router = Router();

router.post('/create', cartController.createCart);
router.delete('/empty/:cid', cartController.emptyCart);

export default router;