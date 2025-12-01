// routes/admin.js
import express from "express";
import { getMembers, changePassword } from "../controllers/adminController.js";
import SkillCategory from "../models/SkillCategory.js";
import Skill from "../models/Skill.js";

// ⭐ Import ALL stats controllers
import {
  usersPerCity,
  skillsPerCategory,
  subscriptionsSummary,
  swapsPerMonth,
  swapsPerMonthDetailed, // <-- added
  totalUsersCount,
  adminStats,
} from "../controllers/adminStats.js";


const router = express.Router();

// =======================================================
// Members & Admin Actions
// =======================================================
router.get("/members", getMembers);
router.put("/change-password", changePassword);

// =======================================================
// Categories & Skills
// =======================================================
router.get("/categories", async (req, res) => {
  try {
    const categories = await SkillCategory.find({ status: "Active" }).lean();
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error("Failed to load categories:", err);
    res.status(500).json({ success: false, message: "Failed to load categories" });
  }
});

router.get("/skills/:categoryId", async (req, res) => {
  try {
    const skills = await Skill.find({
      CategoryId: req.params.categoryId,
      Status: "Active",
    }).lean();

    res.json({ success: true, data: skills });
  } catch (err) {
    console.error("Failed to load skills:", err);
    res.status(500).json({ success: false, message: "Failed to load skills" });
  }
});

// =======================================================
// ⭐ Dashboard Statistics API (used by Admin Panel)
// =======================================================

// 1️⃣ Users grouped by City
router.get("/stats/users-per-city", usersPerCity);

// 1B) Optional: Detailed users inside single city
router.get("/stats/users-per-city/:cityId", async (req, res) => {
  try {
    const cityId = req.params.cityId;
    const User = (await import("../models/User.js")).default;

    const users = await User.find({ City: cityId })
      .select("-Password")
      .lean();

    res.json({ success: true, data: users });
  } catch (err) {
    console.error("Failed to fetch users for city:", err);
    res.status(500).json({ success: false, message: "Failed to fetch city users" });
  }
});

// 2️⃣ Skills Count Per Category
router.get("/stats/skills-per-category", skillsPerCategory);

// 3️⃣ Subscriptions Summary
router.get("/stats/subscriptions", subscriptionsSummary);

// 4️⃣ Skill Swaps Per Month
router.get("/stats/swaps-per-month", swapsPerMonth);

// 5️⃣ ⭐ TOTAL USERS — Dashboard Main Card + Members Chart
router.get("/stats/total-users", totalUsersCount);

// 6️⃣ ⭐ FULL COMBINED DASHBOARD STATS (optional but useful)
router.get("/stats/admin-stats", adminStats);
// 4️⃣ Skill Swaps Per Month (legacy)
router.get("/stats/swaps-per-month", swapsPerMonth);
router.get('/stats/adminStats', adminStats); 
// 4B️⃣ Skill Swaps Per Month — Detailed (active + completed)
router.get("/stats/swaps-per-month-detailed", swapsPerMonthDetailed);

// =======================================================
// Health Check
// =======================================================
router.get("/health", (req, res) => res.json({ success: true, message: "Admin routes OK" }));

export default router;
