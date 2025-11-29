import express from "express";
import {
  createFeedback,
  getFeedbacksBySwap,
  getFeedbacksForUser,
  updateFeedback
} from "../controllers/feedbackController.js";

const router = express.Router();

// Create feedback
router.post("/", createFeedback);
router.put("/:id", updateFeedback);

// Get feedbacks for a given swap
router.get("/swap/:swapId", getFeedbacksBySwap);

// Get feedbacks received by a user
router.get("/user/:userId", getFeedbacksForUser);

export default router;