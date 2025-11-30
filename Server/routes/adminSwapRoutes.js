import express from "express";
import {
  getAdminSwapStats,
  getAdminSwaps,
  getAdminDropdownData
} from "../controllers/adminSwapController.js";

const router = express.Router();

router.get("/stats", getAdminSwapStats);
router.get("/list", getAdminSwaps);

router.get("/dropdown", getAdminDropdownData);

export default router;
