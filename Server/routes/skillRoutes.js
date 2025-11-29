import express from "express";
import {
  addSkill,
  getAllSkills,
  getCategories,
  updateSkill,
  toggleSkillStatus,
} from "../controllers/skillController.js";

const router = express.Router();

router.post("/add", addSkill);
router.get("/list", getAllSkills);
router.get("/categories", getCategories);
router.put("/:id", updateSkill);
router.put("/toggle/:id", toggleSkillStatus); // ✅ activate/deactivate

export default router;
