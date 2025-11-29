import express from "express";
import {
  getPlans,
  getAllPlans,
  addPlan,
  updatePlan,
  deletePlan,
} from "../controllers/subscriptionPlanController.js";

const router = express.Router();

// Public (active plans)
router.get("/", getPlans);

// Admin routes
router.get("/all", getAllPlans);
router.post("/add", addPlan);
router.put("/update/:id", updatePlan);
router.delete("/delete/:id", deletePlan);

export default router;
