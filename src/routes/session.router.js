import { Router } from "express";
import { strategyPassport } from "../middlewares/strategy.middleware.js";
import sessionController from "../controllers/session.controller.js";

const router = Router();

router.get('/current', strategyPassport('jwt'), sessionController.current);

router.post('/register', strategyPassport('register'), sessionController.register);
router.post('/login', strategyPassport('login'), sessionController.login);
router.delete('/logout', sessionController.logOut);

export default router;