// import express from "express";
// import { getMembers, changePassword } from "../controllers/adminController.js";

// const router = express.Router();

// router.get("/members", getMembers);
// router.put("/change-password", changePassword);

// export default router;
import express from "express";
import { getMembers, changePassword } from "../controllers/adminController.js";
import SkillCategory from "../models/SkillCategory.js";
import Skill from "../models/Skill.js";

const router = express.Router();

router.get("/members", getMembers);
router.put("/change-password", changePassword);

// ⭐ New: Fetch All Categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await SkillCategory.find({ status: "Active" }).lean();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load categories" });
  }
});

// ⭐ New: Fetch Skills Under Category
router.get("/skills/:categoryId", async (req, res) => {
  try {
    const skills = await Skill.find({
      CategoryId: req.params.categoryId,
      Status: "Active",
    }).lean();

    res.json({ success: true, data: skills });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load skills" });
  }
});

export default router;
