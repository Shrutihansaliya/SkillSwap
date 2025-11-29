import express from "express";
import {
  addCategory,
  getAllCategories,
  updateCategory,
  toggleCategoryStatus,
} from "../controllers/skillCategoryController.js";

const router = express.Router();

// Routes
router.post("/add", addCategory);
router.get("/", getAllCategories);
router.put("/:id", updateCategory);
router.put("/toggle/:id", toggleCategoryStatus);

export default router;
