import { Router } from "express";
import userController from "../controllers/user.controller.js";


const router = Router();

router.get('/', userController.getAll);
router.put('/update/user/:uid', userController.updateUser);

export default router;