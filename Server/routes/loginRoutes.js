import express from "express";
import { loginUser, resetPassword } from "../controllers/loginController.js";

const router = express.Router();

// 🔹 Login
router.post("/", loginUser);

// 🔹 Reset Password
router.post("/reset-password", resetPassword);

export default router;
