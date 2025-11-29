// routes/userRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

import {
  registerUser,
  verifyOtp,
  getCategories,
  getSkillsByCategory,
  addUserSkills,
  getUserProfile,
  updateUserProfile,
  changePassword,
  getActiveCities,
  getAllUsers,
  getUserSkills
} from "../controllers/userController.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======================
// Multer for profile image
// ======================
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "../uploads/")),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/^image\/(jpeg|jpg|png)$/)) {
      return cb(new Error("Only jpg, jpeg, png images are allowed"), false);
    }
    cb(null, true);
  },
});

// ======================
// ⭐ Combined Multer for Certificates + Content Files
// ======================



// Ensure upload folders exist
const baseUploads = path.join(__dirname, "..", "uploads");
const certFolder = path.join(baseUploads, "certificates");
const contentFolder = path.join(baseUploads, "contentfiles");
if (!fsExistsSync(baseUploads)) fsMkdirSync(baseUploads);
if (!fsExistsSync(certFolder)) fsMkdirSync(certFolder);
if (!fsExistsSync(contentFolder)) fsMkdirSync(contentFolder);

// Multer storage to route files to appropriate folders
const mixedStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "certificates") cb(null, path.join(__dirname, "../uploads/certificates"));
    else if (file.fieldname === "TemplateImages") cb(null, path.join(__dirname, "../uploads/contentfiles")); // store images temporary here
    else cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname.replace(/\s+/g, "_"));
  },
});

const uploadMixed = multer({
  storage: mixedStorage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "TemplateImages") {
      // accept images only
      if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Template image must be an image file"), false);
      }
    }
    // certificates accept pdf or images
    if (file.fieldname === "certificates") {
      if (!(
        file.mimetype === "application/pdf" ||
        file.mimetype.startsWith("image/")
      )) {
        return cb(new Error("Only PDF or image allowed for certificates"), false);
      }
    }
    cb(null, true);
  },
});
// Helper FS functions used above
import fs from "fs";
function fsExistsSync(p) { try { return fs.existsSync(p); } catch (e) { return false; } }
function fsMkdirSync(p) { try { fs.mkdirSync(p, { recursive: true }); } catch (e) {} }
// ======================
// ROUTES
// ======================

router.post("/register", upload.single("profileImage"), registerUser);
router.post("/verify-otp", verifyOtp);

router.get("/categories", getCategories);
router.get("/skills/category/:categoryId", getSkillsByCategory);

// ⭐ FIXED MULTIPLE FILE UPLOAD ROUTE
router.post(
  "/user-skills",
  uploadMixed.fields([
    { name: "certificates", maxCount: 5 },
    { name: "contentFiles", maxCount: 5 },
  ]),
  addUserSkills
);

router.get("/profile/:id", getUserProfile);
router.put("/update/:id", upload.single("profileImage"), updateUserProfile);

router.put("/change-password", changePassword);

// Get active cities for dropdown
router.get("/active-cities", getActiveCities);

// Get all users
router.get("/profile/all", getAllUsers);

// Get skills for a specific user
router.get("/skills/:userId", getUserSkills);

// Fetch skills for request page
router.get("/userskills/:userId", async (req, res) => {
  try {
    const skills = await UserSkill.find({ UserId: req.params.userId })
      .populate("SkillId", "Name SkillId")
      .lean();

    res.json({ success: true, skills });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching user skills" });
  }
});

export default router;




