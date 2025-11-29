// routes/purchaseSubscriptionRoute.js
import express from "express";
import { purchaseSubscription, getUserSubscription } from "../controllers/purchaseSubscriptionController.js";

const router = express.Router();

router.post("/", purchaseSubscription);             // Purchase a plan
router.get("/:userId", getUserSubscription);        // Get user's active subscription

export default router;
