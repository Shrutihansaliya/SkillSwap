// routes/authRoutes.js

import express from "express";
import { registerUser, verifyOtp, resendOtp } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

export default router;
