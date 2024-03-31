import { Router } from "express";
import userController from "../controllers/user.controller.js";


const router = Router();

router.put('/update/user/:uid', userController.updateUser);

export default router;