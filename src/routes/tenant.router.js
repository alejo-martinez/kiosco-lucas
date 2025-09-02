import { Router } from "express";
import { godUser } from "../middlewares/auth.middleware.js";
import tenantController from "../controllers/masterDb.controller.js";

const router = Router();

router.post("/", godUser, tenantController.createNewTenant);

export default router;