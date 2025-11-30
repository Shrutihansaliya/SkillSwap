// routes/overviewRoutes.js
import express from "express";
import { getOverviewStats, getUserSwapHistory, getUserSwaps } from "../controllers/overviewController.js";

const router = express.Router();

router.get("/:userId", getOverviewStats);
router.get("/swaps/:userId", getUserSwapHistory);   // ⭐ ADD THIS
router.get("/swaps/:userId", getUserSwaps);

export default router;
