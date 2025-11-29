// routes/overviewRoutes.js
import express from "express";
import { getOverviewStats } from "../controllers/overviewController.js";

const router = express.Router();

router.get("/:userId", getOverviewStats);

export default router;
