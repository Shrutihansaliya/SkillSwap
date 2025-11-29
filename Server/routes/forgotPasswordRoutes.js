import express from "express";
import { requestOtp, verifyOtp, resetPassword } from "../controllers/forgotPasswordController.js";

const router = express.Router();

// Step 1
router.post("/request-otp", requestOtp);

// Step 2
router.post("/verify-otp", verifyOtp);

// Step 3
router.post("/reset-password", resetPassword);

export default router;
