// Server/routes/reportRoutes.js
import express from "express";
import {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
  deleteReport,
} from "../controllers/reportController.js";

import userAuth from "../middleware/userAuth.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// public for logged-in users
router.post("/", userAuth, createReport);

// admin-only
router.get("/", userAuth, adminAuth, getReports);
router.get("/:id", userAuth, adminAuth, getReportById);
router.put("/:id", userAuth, adminAuth, updateReportStatus);
router.delete("/:id", userAuth, adminAuth, deleteReport);

export default router;
