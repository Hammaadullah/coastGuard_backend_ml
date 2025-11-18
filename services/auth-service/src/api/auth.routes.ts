import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/profile/me", authMiddleware, authController.getProfile);
router.post("/login", authController.login);
router.post("/register", authController.register);

export default router;
