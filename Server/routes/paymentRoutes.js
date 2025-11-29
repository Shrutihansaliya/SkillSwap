// routes/paymentRoutes.js
import express from "express";
import {
  createOrder,
  verifyPayment,
  getTotalRevenue,
  getAllPayments,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);
router.get("/total-revenue", getTotalRevenue);

// 👉 Admin payment list
router.get("/admin/payments", getAllPayments);

export default router;