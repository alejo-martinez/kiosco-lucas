import viewsController from "../controllers/views.controller.js";
import { Router } from "express";
import { adminUser, authToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get('/login', authToken, viewsController.login);
router.get('/singup', authToken, adminUser, viewsController.register);
router.get('/', authToken, viewsController.home);

router.get('/:option/:model', authToken, adminUser, viewsController.panelOption);
router.get('/update/prod/:pid', authToken, adminUser, viewsController.showProd);
router.get('/show/summaries/:cat', authToken,  viewsController.getAllSummary);
router.get('/show/summary/:sid', authToken, viewsController.showSummary);
router.get('/orders', authToken, viewsController.getOrders);
router.get('/show/order/:tid', authToken, viewsController.showOrder);
router.get('/show/user/:uid', authToken, adminUser, viewsController.showUser);
router.get('/products', authToken, viewsController.allProducts);

export default router;